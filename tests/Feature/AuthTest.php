<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_student_can_register_and_receives_a_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Ana Reyes',
            'email' => 'ana@school.edu',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'ana@school.edu')
            ->assertJsonPath('user.role', 'student')
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role'], 'token']);

        $this->assertDatabaseHas('users', ['email' => 'ana@school.edu', 'role' => 'student']);
    }

    public function test_registration_cannot_be_used_to_create_an_administrator(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Sneaky Student',
            'email' => 'sneaky@school.edu',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
            'role' => 'admin',
        ])->assertCreated()->assertJsonPath('user.role', 'student');

        $this->assertDatabaseHas('users', ['email' => 'sneaky@school.edu', 'role' => 'student']);
    }

    public function test_the_password_is_stored_hashed(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Ana Reyes',
            'email' => 'ana@school.edu',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
        ])->assertCreated();

        $this->assertNotSame('secret-password', User::first()->password);
    }

    public function test_registration_rejects_a_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@school.edu']);

        $this->postJson('/api/register', [
            'name' => 'Someone Else',
            'email' => 'taken@school.edu',
            'password' => 'secret-password',
            'password_confirmation' => 'secret-password',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_registration_requires_a_matching_confirmation(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Ana Reyes',
            'email' => 'ana@school.edu',
            'password' => 'secret-password',
            'password_confirmation' => 'different-password',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_a_user_can_log_in(): void
    {
        User::factory()->create(['email' => 'ana@school.edu']);

        $this->postJson('/api/login', [
            'email' => 'ana@school.edu',
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['user', 'token']);
    }

    public function test_the_email_is_matched_case_insensitively(): void
    {
        User::factory()->create(['email' => 'ana@school.edu']);

        $this->postJson('/api/login', [
            'email' => 'ANA@School.edu',
            'password' => 'password',
        ])->assertOk();
    }

    public function test_login_fails_with_the_wrong_password(): void
    {
        User::factory()->create(['email' => 'ana@school.edu']);

        $this->postJson('/api/login', [
            'email' => 'ana@school.edu',
            'password' => 'wrong-password',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_login_does_not_reveal_whether_an_account_exists(): void
    {
        User::factory()->create(['email' => 'ana@school.edu']);

        $existing = $this->postJson('/api/login', ['email' => 'ana@school.edu', 'password' => 'wrong']);
        $missing = $this->postJson('/api/login', ['email' => 'nobody@school.edu', 'password' => 'wrong']);

        $this->assertSame(
            $existing->json('errors.email'),
            $missing->json('errors.email'),
        );
    }

    public function test_an_authenticated_user_can_read_their_own_account(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_logging_out_revokes_the_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/user')
            ->assertUnauthorized();
    }

    public function test_protected_endpoints_reject_an_unauthenticated_request(): void
    {
        foreach (['/api/user', '/api/dashboard', '/api/reviewers', '/api/concerns'] as $endpoint) {
            $this->getJson($endpoint)->assertUnauthorized();
        }
    }

    public function test_an_unauthenticated_response_is_clean_json(): void
    {
        $this->getJson('/api/dashboard')
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Please sign in to continue.']);
    }
}
