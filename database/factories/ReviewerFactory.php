<?php

namespace Database\Factories;

use App\Models\Reviewer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewerFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->slug(3).'.pdf';

        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'subject' => fake()->randomElement(config('reviewers.subjects')),
            'year_level' => fake()->randomElement(config('reviewers.year_levels')),
            'file_path' => 'reviewers/'.$name,
            'file_name' => $name,
            'file_mime' => 'application/pdf',
            'file_size' => fake()->numberBetween(1000, 500000),
            'uploaded_by' => User::factory(),
            'status' => Reviewer::STATUS_APPROVED,
        ];
    }

    public function approved(): static
    {
        return $this->state(['status' => Reviewer::STATUS_APPROVED]);
    }

    public function flagged(): static
    {
        return $this->state([
            'status' => Reviewer::STATUS_FLAGGED,
            'ai_decision' => 'review',
            'ai_confidence' => 0.72,
            'ai_reason' => 'Appears academic but needs verification.',
            'ai_analyzed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(['status' => Reviewer::STATUS_REJECTED]);
    }

    public function pending(): static
    {
        return $this->state(['status' => Reviewer::STATUS_PENDING]);
    }
}
