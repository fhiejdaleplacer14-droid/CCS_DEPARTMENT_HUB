<?php

namespace App\Services;

use App\Support\ReviewerAnalysis;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class GeminiService
{
    public function __construct(private readonly DocumentTextExtractor $extractor)
    {
    }

    public function isConfigured(): bool
    {
        return filled(config('gemini.api_key'));
    }

    public function analyzeReviewer(string $absolutePath, string $extension, string $title, ?string $description): ReviewerAnalysis
    {
        if (! $this->isConfigured()) {
            return ReviewerAnalysis::unavailable('AI screening is not configured; queued for manual review.');
        }

        try {
            $parts = $this->buildContentParts($absolutePath, $extension, $title, $description);
        } catch (Throwable $e) {
            Log::warning('Gemini: could not prepare document for screening.', ['error' => $e->getMessage()]);

            return ReviewerAnalysis::unavailable('The document could not be read for AI screening; queued for manual review.');
        }

        if ($parts === null) {
            return ReviewerAnalysis::unavailable('No readable text was found in the document; queued for manual review.');
        }

        try {
            $response = Http::timeout((int) config('gemini.timeout'))
                ->asJson()
                ->withQueryParameters(['key' => config('gemini.api_key')])
                ->retry(
                    times: max(1, (int) config('gemini.retry_times')),
                    sleepMilliseconds: fn (int $attempt) => $attempt * (int) config('gemini.retry_delay_ms'),
                    when: fn (Throwable $e) => $this->isTransient($e),
                    throw: false,
                )
                ->post($this->endpoint(), [
                    'contents' => [['role' => 'user', 'parts' => $parts]],
                    'systemInstruction' => [
                        'parts' => [['text' => $this->systemInstruction()]],
                    ],
                    'generationConfig' => $this->generationConfig(),
                ]);
        } catch (Throwable $e) {
            Log::warning('Gemini: request failed.', ['error' => $e->getMessage()]);

            return ReviewerAnalysis::unavailable('AI screening is temporarily unavailable; queued for manual review.');
        }

        if ($response->failed()) {
            Log::warning('Gemini: non-successful response.', [
                'status' => $response->status(),
                'body' => Str::limit($response->body(), 500),
            ]);

            return ReviewerAnalysis::unavailable('AI screening returned an error; queued for manual review.');
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');

        if (! is_string($text) || blank($text)) {
            $finishReason = (string) data_get($response->json(), 'candidates.0.finishReason');

            Log::warning('Gemini: response contained no text part.', [
                'finish_reason' => $finishReason,
                'thoughts_tokens' => data_get($response->json(), 'usageMetadata.thoughtsTokenCount'),
            ]);

            return ReviewerAnalysis::unavailable(
                $finishReason === 'MAX_TOKENS'
                    ? 'AI screening ran out of its output budget; queued for manual review.'
                    : 'AI screening returned an empty result; queued for manual review.'
            );
        }

        return $this->parse($text);
    }

    /**
     * @return array<string, mixed>
     */
    private function generationConfig(): array
    {
        $config = [
            'temperature' => 0.1,
            'responseMimeType' => 'application/json',
            'maxOutputTokens' => (int) config('gemini.max_output_tokens'),
        ];

        $thinkingBudget = config('gemini.thinking_budget');

        if ($thinkingBudget !== null) {
            $config['thinkingConfig'] = ['thinkingBudget' => (int) $thinkingBudget];
        }

        return $config;
    }

    private function isTransient(Throwable $e): bool
    {
        if ($e instanceof ConnectionException) {
            return true;
        }

        return $e instanceof RequestException
            && in_array($e->response->status(), [429, 500, 502, 503, 504], true);
    }

    /**
     * @return array<int, array<string, mixed>>|null
     */
    private function buildContentParts(string $absolutePath, string $extension, string $title, ?string $description): ?array
    {
        $context = sprintf(
            "The student submitted this document with:\nTitle: %s\nDescription: %s\n\nAnalyse the document itself, not only the title.",
            $title,
            blank($description) ? '(none provided)' : $description,
        );

        if (strtolower($extension) === 'pdf') {
            $bytes = @file_get_contents($absolutePath);

            if ($bytes === false) {
                return null;
            }

            return [
                ['text' => $context],
                ['inline_data' => [
                    'mime_type' => 'application/pdf',
                    'data' => base64_encode($bytes),
                ]],
            ];
        }

        $text = $this->extractor->extract($absolutePath, $extension);

        if ($text === null) {
            return null;
        }

        return [
            ['text' => $context."\n\n--- DOCUMENT TEXT ---\n".$text],
        ];
    }

    private function endpoint(): string
    {
        return rtrim((string) config('gemini.base_url'), '/')
            .'/models/'.config('gemini.model').':generateContent';
    }

    private function systemInstruction(): string
    {
        $subjects = implode(', ', config('reviewers.subjects'));
        $yearLevels = implode(', ', config('reviewers.year_levels'));

        return <<<PROMPT
        You screen uploads for a college Computer Studies department reviewer library.

        An academic reviewer is study material a student would revise from: lecture notes,
        summaries, study guides, practice questions, worked examples, exam reviewers, or
        topic outlines.

        It is NOT a reviewer if it is: a resume, invoice, receipt, personal document,
        advertisement, random image or scan with no study content, unrelated essay,
        pirated book, or anything offensive or inappropriate for a school library.

        Reply with JSON only, matching exactly this shape:
        {
          "is_reviewer": boolean,
          "confidence": number between 0 and 1,
          "subject": string or null,
          "year_level": string or null,
          "topics": array of up to 6 short topic strings,
          "quality": one of "poor", "fair", "good", "excellent",
          "decision": one of "approve", "review", "reject",
          "reason": one or two plain sentences a student would understand
        }

        Guidance:
        - "confidence" is how certain you are about the is_reviewer judgement.
        - Prefer a subject from this list when one fits: {$subjects}.
        - Prefer a year level from this list when one fits: {$yearLevels}.
        - Use "review" when the document is plausible study material but you cannot be sure.
        - Keep "reason" factual and free of markdown.
        PROMPT;
    }

    private function parse(string $raw): ReviewerAnalysis
    {
        $json = $this->decodeJson($raw);

        if ($json === null) {
            Log::warning('Gemini: reply was not valid JSON.', ['raw' => Str::limit($raw, 500)]);

            return ReviewerAnalysis::unavailable('The AI response could not be understood; queued for manual review.');
        }

        if (! array_key_exists('is_reviewer', $json) || ! array_key_exists('confidence', $json)) {
            Log::warning('Gemini: reply missing required keys.', ['keys' => array_keys($json)]);

            return ReviewerAnalysis::unavailable('The AI response was incomplete; queued for manual review.');
        }

        $confidence = $json['confidence'];

        if (! is_numeric($confidence)) {
            return ReviewerAnalysis::unavailable('The AI response had an invalid confidence value; queued for manual review.');
        }

        $recommendation = is_string($json['decision'] ?? null) ? strtolower(trim($json['decision'])) : 'review';

        if (! in_array($recommendation, ['approve', 'review', 'reject'], true)) {
            $recommendation = 'review';
        }

        $quality = is_string($json['quality'] ?? null) ? strtolower(trim($json['quality'])) : null;

        if (! in_array($quality, ['poor', 'fair', 'good', 'excellent'], true)) {
            $quality = null;
        }

        return new ReviewerAnalysis(
            isReviewer: (bool) $json['is_reviewer'],
            confidence: max(0.0, min(1.0, (float) $confidence)),
            subject: $this->cleanString($json['subject'] ?? null, 255),
            yearLevel: $this->cleanString($json['year_level'] ?? null, 50),
            topics: $this->cleanTopics($json['topics'] ?? null),
            quality: $quality,
            recommendation: $recommendation,
            reason: $this->cleanString($json['reason'] ?? null, 1000) ?? 'No reason provided by the AI screening.',
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeJson(string $raw): ?array
    {
        $raw = trim($raw);

        if (str_starts_with($raw, '```')) {
            $raw = trim(preg_replace('/^```[a-zA-Z]*\s*|\s*```$/', '', $raw) ?? $raw);
        }

        $decoded = json_decode($raw, true);

        if (is_array($decoded)) {
            return $decoded;
        }

        if (preg_match('/\{.*\}/s', $raw, $matches)) {
            $decoded = json_decode($matches[0], true);

            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    private function cleanString(mixed $value, int $limit): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim(strip_tags($value));

        return $value === '' ? null : Str::limit($value, $limit, '');
    }

    /**
     * @return array<int, string>
     */
    private function cleanTopics(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return collect($value)
            ->filter(fn ($topic) => is_string($topic))
            ->map(fn (string $topic) => Str::limit(trim(strip_tags($topic)), 60, ''))
            ->filter()
            ->unique()
            ->take(6)
            ->values()
            ->all();
    }
}
