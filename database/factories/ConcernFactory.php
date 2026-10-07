<?php

namespace Database\Factories;

use App\Models\Concern;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConcernFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(4),
            'category' => fake()->randomElement(Concern::CATEGORIES),
            'description' => fake()->paragraph(),
            'location' => fake()->randomElement(['Room 301', 'Computer Laboratory 2', null]),
            'status' => Concern::STATUS_SUBMITTED,
        ];
    }
}
