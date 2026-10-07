<?php

return [

    // Read on the server only. Never expose this to the React frontend.
    'api_key' => env('GEMINI_API_KEY'),

    'model' => env('GEMINI_MODEL', 'gemini-3.5-flash-lite'),

    'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),

    'timeout' => (int) env('GEMINI_TIMEOUT', 45),

    /*
     * Reasoning models count their internal thinking against this budget, so
     * it needs headroom: too low and the reply is truncated before any JSON
     * is produced, which reads as an empty response.
     */
    'max_output_tokens' => (int) env('GEMINI_MAX_OUTPUT_TOKENS', 2048),

    /*
     * 0 turns reasoning off for this classification task. Left null nothing is
     * sent at all, because models that do not support thinkingConfig reject
     * the whole request with a 400.
     *
     * blank() rather than a null check: env() returns '' for a key that is
     * present but empty, which would otherwise cast to 0 and send it anyway.
     */
    'thinking_budget' => blank(env('GEMINI_THINKING_BUDGET'))
        ? null
        : (int) env('GEMINI_THINKING_BUDGET'),

    /*
     * Laravel, not Gemini, decides a reviewer's fate. These are applied to the
     * confidence the model reports:
     *
     *   >= approve, and a reviewer -> APPROVED
     *   >= flag                    -> FLAGGED
     *   below flag, or not one     -> REJECTED
     */
    'thresholds' => [
        'approve' => (float) env('GEMINI_APPROVE_THRESHOLD', 0.85),
        'flag' => (float) env('GEMINI_FLAG_THRESHOLD', 0.55),
    ],

    /*
     * Applied when Gemini is unreachable, unconfigured or unusable. FLAGGED
     * keeps a human in the loop rather than silently approving or discarding
     * a student's upload.
     */
    'fallback_status' => env('GEMINI_FALLBACK_STATUS', 'FLAGGED'),

    // 429 and 503 are transient; a bad key or model is not, and is not retried.
    'retry_times' => (int) env('GEMINI_RETRY_TIMES', 4),

    'retry_delay_ms' => (int) env('GEMINI_RETRY_DELAY_MS', 750),

];
