<?php

namespace App\Services;

use App\Models\Reviewer;
use App\Support\ReviewerAnalysis;
use Illuminate\Support\Facades\Storage;

class ReviewerScreeningService
{
    public function __construct(private readonly GeminiService $gemini)
    {
    }

    public function screen(Reviewer $reviewer): Reviewer
    {
        $analysis = $this->gemini->analyzeReviewer(
            absolutePath: Storage::disk('local')->path($reviewer->file_path),
            extension: pathinfo($reviewer->file_name, PATHINFO_EXTENSION),
            title: $reviewer->title,
            description: $reviewer->description,
        );

        $reviewer->update([
            'status' => $this->decideStatus($analysis),
            'ai_decision' => $analysis->available ? $analysis->recommendation : null,
            'ai_confidence' => $analysis->available ? $analysis->confidence : null,
            'ai_subject' => $analysis->subject,
            'ai_year_level' => $analysis->yearLevel,
            'ai_topics' => $analysis->topics,
            'ai_quality' => $analysis->quality,
            'ai_reason' => $analysis->reason,
            'ai_analyzed_at' => now(),
        ]);

        return $reviewer;
    }

    private function decideStatus(ReviewerAnalysis $analysis): string
    {
        if (! $analysis->available) {
            return $this->fallbackStatus();
        }

        $approveAt = (float) config('gemini.thresholds.approve');
        $flagAt = (float) config('gemini.thresholds.flag');

        if (! $analysis->isReviewer) {
            // Confidently not study material; otherwise the model is unsure, so flag it.
            return $analysis->confidence >= $flagAt
                ? Reviewer::STATUS_REJECTED
                : Reviewer::STATUS_FLAGGED;
        }

        if ($analysis->recommendation === 'reject') {
            return Reviewer::STATUS_REJECTED;
        }

        if ($analysis->recommendation === 'review') {
            return Reviewer::STATUS_FLAGGED;
        }

        return match (true) {
            $analysis->confidence >= $approveAt => Reviewer::STATUS_APPROVED,
            $analysis->confidence >= $flagAt => Reviewer::STATUS_FLAGGED,
            default => Reviewer::STATUS_REJECTED,
        };
    }

    private function fallbackStatus(): string
    {
        $status = (string) config('gemini.fallback_status');

        return in_array($status, Reviewer::STATUSES, true) ? $status : Reviewer::STATUS_FLAGGED;
    }
}
