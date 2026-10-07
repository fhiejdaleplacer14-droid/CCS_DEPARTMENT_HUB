<?php

namespace App\Console\Commands;

use App\Services\GeminiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class CheckGemini extends Command
{
    protected $signature = 'gemini:check';

    protected $description = 'Verify the Google Gemini API key, model and reviewer screening';

    public function handle(GeminiService $gemini): int
    {
        $this->newLine();
        $this->line('  <options=bold>Gemini configuration check</>');
        $this->newLine();

        if (! $this->checkKeyPresent()) {
            return self::FAILURE;
        }

        if (! $this->checkKeyValidAndModelAvailable()) {
            return self::FAILURE;
        }

        if (! $this->checkGenerationWorks()) {
            return self::FAILURE;
        }

        return $this->checkScreening($gemini) ? self::SUCCESS : self::FAILURE;
    }

    private function checkKeyPresent(): bool
    {
        $key = (string) config('gemini.api_key');

        if ($key === '') {
            $this->components->error('No API key found.');
            $this->line('  Add this to your <options=bold>.env</> file, then run the command again:');
            $this->newLine();
            $this->line('      <fg=gray>GEMINI_API_KEY=your-key-here</>');
            $this->newLine();
            $this->line('  Get a key from <options=bold>https://aistudio.google.com/apikey</>');
            $this->line('  If you edited .env while a server was running, run <options=bold>php artisan config:clear</>.');
            $this->newLine();

            return false;
        }

        $this->components->twoColumnDetail(
            'API key',
            sprintf('<fg=green>found</> <fg=gray>(%d chars, ends %s)</>', strlen($key), Str::substr($key, -4)),
        );

        $this->components->twoColumnDetail('Model', config('gemini.model'));
        $this->components->twoColumnDetail(
            'Thresholds',
            sprintf(
                'approve >= %s, flag >= %s',
                config('gemini.thresholds.approve'),
                config('gemini.thresholds.flag'),
            ),
        );

        return true;
    }

    private function checkKeyValidAndModelAvailable(): bool
    {
        $this->newLine();
        $this->line('  Contacting Google...');

        try {
            $response = Http::timeout((int) config('gemini.timeout'))
                ->withQueryParameters(['key' => config('gemini.api_key')])
                ->get(rtrim((string) config('gemini.base_url'), '/').'/models');
        } catch (Throwable $e) {
            $this->components->error('Could not reach the Gemini API.');
            $this->line('  '.$e->getMessage());
            $this->line('  Check your internet connection, firewall or proxy.');

            return false;
        }

        if ($response->status() === 400 || $response->status() === 403) {
            $this->components->error('The API key was rejected ('.$response->status().').');
            $this->line('  '.($response->json('error.message') ?? 'Check the key is correct and the API is enabled.'));
            $this->line('  Make sure you pasted the whole key with no quotes or trailing spaces.');

            return false;
        }

        if ($response->failed()) {
            $this->components->error('Gemini returned HTTP '.$response->status().'.');
            $this->line('  '.Str::limit((string) $response->json('error.message'), 200));

            return false;
        }

        $this->components->twoColumnDetail('Key accepted', '<fg=green>yes</>');

        $available = collect($response->json('models') ?? [])
            ->pluck('name')
            ->map(fn (string $name) => Str::after($name, 'models/'))
            ->all();

        $configured = (string) config('gemini.model');

        if ($available !== [] && ! in_array($configured, $available, true)) {
            $this->components->warn("The configured model \"{$configured}\" is not in the list this key can use.");

            $suggestions = collect($available)
                ->filter(fn (string $name) => str_contains($name, 'flash') && ! str_contains($name, 'embedding'))
                ->take(8);

            if ($suggestions->isNotEmpty()) {
                $this->line('  Try one of these in <options=bold>GEMINI_MODEL</>:');

                foreach ($suggestions as $name) {
                    $this->line("      <fg=gray>{$name}</>");
                }
            }

            $this->newLine();

            return false;
        }

        if ($available !== []) {
            $this->components->twoColumnDetail('Model listed', '<fg=green>yes</>');
        }

        return true;
    }

    private function checkGenerationWorks(): bool
    {
        $this->newLine();
        $this->line('  Testing the model...');

        try {
            $response = Http::timeout((int) config('gemini.timeout'))
                ->asJson()
                ->withQueryParameters(['key' => config('gemini.api_key')])
                ->post(
                    rtrim((string) config('gemini.base_url'), '/')
                        .'/models/'.config('gemini.model').':generateContent',
                    [
                        'contents' => [['role' => 'user', 'parts' => [['text' => 'Reply with the word: ok']]]],
                        'generationConfig' => ['maxOutputTokens' => 10, 'temperature' => 0],
                    ],
                );
        } catch (Throwable $e) {
            $this->components->error('The request to the model failed.');
            $this->line('  '.$e->getMessage());

            return false;
        }

        if ($response->failed()) {
            $apiMessage = (string) ($response->json('error.message') ?? $response->body());

            $this->components->error('The model rejected the request (HTTP '.$response->status().').');
            $this->newLine();
            $this->line('  <fg=yellow>'.wordwrap($apiMessage, 100, "
  ").'</>');
            $this->newLine();

            // Google names the replacement model in its own message.
            if (preg_match('/use\s+models\/([a-zA-Z0-9.\-]+)/', $apiMessage, $matches)) {
                $this->line('  Google suggests this model instead. Set it in <options=bold>.env</>:');
                $this->newLine();
                $this->line('      <fg=gray>GEMINI_MODEL='.$matches[1].'</>');
                $this->newLine();
                $this->line('  Then run <options=bold>php artisan config:clear && php artisan gemini:check</>');
            } elseif ($response->status() === 503) {
                $this->line('  The model is temporarily overloaded. This is transient -- try again shortly.');
                $this->line('  Uploads retry automatically, so the application tolerates short outages.');
            }

            $this->newLine();

            return false;
        }

        $this->components->twoColumnDetail('Model usable', '<fg=green>yes</>');

        return true;
    }

    private function checkScreening(GeminiService $gemini): bool
    {
        $this->newLine();
        $this->line('  Screening a sample reviewer...');

        $path = tempnam(sys_get_temp_dir(), 'gemini-check').'.txt';

        file_put_contents($path, <<<'SAMPLE'
        Database Systems Reviewer - Midterm

        1. Normalization
        1NF: all attribute values are atomic.
        2NF: 1NF and no partial dependency on a composite primary key.
        3NF: 2NF and no transitive dependency on non-key attributes.
        BCNF: every determinant is a candidate key.

        2. SQL Basics
        SELECT columns FROM table WHERE condition GROUP BY col HAVING cond ORDER BY col;
        Join types: INNER, LEFT OUTER, RIGHT OUTER, FULL OUTER, CROSS.

        3. Transactions and ACID
        Atomicity, Consistency, Isolation, Durability. A transaction either commits
        entirely or rolls back entirely.

        Practice questions
        Q1. Normalize ORDER(order_id, product_id, product_name, qty) to 3NF.
        Q2. Write a query listing every student with more than three enrolments.
        Q3. Explain the difference between a candidate key and a superkey.
        SAMPLE);

        try {
            $analysis = $gemini->analyzeReviewer(
                absolutePath: $path,
                extension: 'txt',
                title: 'Database Systems Reviewer',
                description: 'Midterm reviewer covering normalization, SQL and transactions.',
            );
        } finally {
            @unlink($path);
        }

        $this->newLine();

        if (! $analysis->available) {
            $this->components->error('Screening did not complete.');
            $this->line('  '.$analysis->reason);
            $this->line('  Uploads would be given the fallback status: <options=bold>'.config('gemini.fallback_status').'</>');
            $this->line('  See <options=bold>storage/logs/laravel.log</> for the underlying error.');
            $this->newLine();

            return false;
        }

        $this->components->twoColumnDetail('Is a reviewer', $analysis->isReviewer ? '<fg=green>yes</>' : '<fg=red>no</>');
        $this->components->twoColumnDetail('Confidence', round($analysis->confidence * 100).'%');
        $this->components->twoColumnDetail('Recommendation', $analysis->recommendation);
        $this->components->twoColumnDetail('Detected subject', $analysis->subject ?? '--');
        $this->components->twoColumnDetail('Detected year level', $analysis->yearLevel ?? '--');
        $this->components->twoColumnDetail('Quality', $analysis->quality ?? '--');
        $this->components->twoColumnDetail('Topics', $analysis->topics ? implode(', ', $analysis->topics) : '--');
        $this->newLine();
        $this->line('  <options=bold>Reason</>');
        $this->line('  <fg=gray>'.wordwrap($analysis->reason, 100, "\n  ").'</>');
        $this->newLine();

        if ($analysis->isReviewer && $analysis->confidence >= (float) config('gemini.thresholds.approve')) {
            $this->components->info('Gemini screening is working. This sample would be APPROVED automatically.');

            return true;
        }

        $this->components->warn(
            'Gemini replied, but was not confident enough to auto-approve a clear reviewer. '
            .'Uploads will mostly be FLAGGED for manual review. Consider lowering '
            .'GEMINI_APPROVE_THRESHOLD or trying a stronger model.'
        );

        return true;
    }
}
