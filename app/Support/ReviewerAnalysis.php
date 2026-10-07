<?php

namespace App\Support;

class ReviewerAnalysis
{
    public function __construct(
        public readonly bool $isReviewer,
        public readonly float $confidence,
        public readonly ?string $subject,
        public readonly ?string $yearLevel,
        public readonly array $topics,
        public readonly ?string $quality,
        public readonly string $recommendation,
        public readonly string $reason,
        public readonly bool $available = true,
    ) {
    }

    public static function unavailable(string $reason): self
    {
        return new self(
            isReviewer: false,
            confidence: 0.0,
            subject: null,
            yearLevel: null,
            topics: [],
            quality: null,
            recommendation: 'review',
            reason: $reason,
            available: false,
        );
    }
}
