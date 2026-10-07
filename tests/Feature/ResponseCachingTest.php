<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Concern;
use App\Models\PersonalAccessToken;
use App\Models\Reviewer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ResponseCachingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        config()->set('gemini.api_key', 'test-key');

        Http::fake(['*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => json_encode([
                'is_reviewer' => true,
                'confidence' => 0.95,
                'topics' => ['SQL'],
                'decision' => 'approve',
                'reason' => 'Study material.',
            ])]]]]],
        ])]);
    }

    public function test_one_students_upload_list_is_never_served_to_another(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Reviewer::factory()->flagged()->create(['uploaded_by' => $alice->id, 'title' => 'Alice private draft']);

        $this->actingAs($alice)->getJson('/api/reviewers?mine=1')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($bob)->getJson('/api/reviewers?mine=1')
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonMissing(['title' => 'Alice private draft']);
    }

    public function test_the_ai_breakdown_is_not_leaked_through_a_cached_list(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        Reviewer::factory()->approved()->create([
            'uploaded_by' => $owner->id,
            'ai_reason' => 'Internal screening note.',
        ]);

        $this->actingAs($owner)->getJson('/api/reviewers')
            ->assertOk()
            ->assertJsonPath('data.0.ai.reason', 'Internal screening note.');

        $this->actingAs($other)->getJson('/api/reviewers')
            ->assertOk()
            ->assertJsonMissingPath('data.0.ai');
    }

    public function test_one_students_concern_list_is_never_served_to_another(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Concern::factory()->create(['user_id' => $alice->id, 'title' => 'Alice concern']);

        $this->actingAs($alice)->getJson('/api/concerns')->assertOk()->assertJsonCount(1, 'data');
        $this->actingAs($bob)->getJson('/api/concerns')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_one_students_dashboard_is_never_served_to_another(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Reviewer::factory()->count(2)->create(['uploaded_by' => $alice->id]);

        $this->actingAs($alice)->getJson('/api/dashboard')->assertJsonPath('stats.my_uploads', 2);
        $this->actingAs($bob)->getJson('/api/dashboard')->assertJsonPath('stats.my_uploads', 0);
    }

    public function test_uploading_a_reviewer_appears_in_the_list_at_once(): void
    {
        $student = User::factory()->create();

        $this->actingAs($student)->getJson('/api/reviewers')->assertJsonCount(0, 'data');

        $this->actingAs($student)->postJson('/api/reviewers', [
            'title' => 'Freshly Uploaded Reviewer',
            'subject' => 'Database Systems',
            'year_level' => '1st Year',
            'file' => UploadedFile::fake()->create('r.pdf', 50, 'application/pdf'),
        ])->assertCreated();

        $this->actingAs($student)->getJson('/api/reviewers')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Freshly Uploaded Reviewer');
    }

    public function test_uploading_updates_the_dashboard_at_once(): void
    {
        $student = User::factory()->create();

        $this->actingAs($student)->getJson('/api/dashboard')->assertJsonPath('stats.my_uploads', 0);

        $this->actingAs($student)->postJson('/api/reviewers', [
            'title' => 'Another Reviewer',
            'subject' => 'Database Systems',
            'year_level' => '1st Year',
            'file' => UploadedFile::fake()->create('r.pdf', 50, 'application/pdf'),
        ])->assertCreated();

        $this->actingAs($student)->getJson('/api/dashboard')->assertJsonPath('stats.my_uploads', 1);
    }

    public function test_submitting_a_concern_appears_at_once(): void
    {
        $student = User::factory()->create();

        $this->actingAs($student)->getJson('/api/concerns')->assertJsonCount(0, 'data');

        $this->actingAs($student)->postJson('/api/concerns', [
            'title' => 'Projector not working',
            'category' => 'Classroom',
            'description' => 'The projector in room 305 does not switch on.',
        ])->assertCreated();

        $this->actingAs($student)->getJson('/api/concerns')->assertJsonCount(1, 'data');
        $this->actingAs($student)->getJson('/api/dashboard')->assertJsonPath('stats.my_concerns', 1);
    }

    public function test_approving_a_reviewer_publishes_it_at_once(): void
    {
        $student = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $reviewer = Reviewer::factory()->flagged()->create();

        $this->actingAs($student)->getJson('/api/reviewers')->assertJsonCount(0, 'data');

        $this->actingAs($admin)
            ->putJson("/api/admin/reviewers/{$reviewer->id}/status", ['status' => 'APPROVED'])
            ->assertOk();

        $this->actingAs($student)->getJson('/api/reviewers')->assertJsonCount(1, 'data');
    }

    public function test_publishing_an_announcement_appears_at_once(): void
    {
        $admin = User::factory()->admin()->create();

        $this->getJson('/api/announcements')->assertJsonCount(0, 'data');

        $this->actingAs($admin)->postJson('/api/admin/announcements', [
            'title' => 'Examination Schedule Posted',
            'content' => 'The schedule is now on the department board.',
        ])->assertCreated();

        $this->getJson('/api/announcements')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Examination Schedule Posted');
    }

    public function test_deleting_an_announcement_removes_it_at_once(): void
    {
        $admin = User::factory()->admin()->create();
        $announcement = Announcement::factory()->create();

        $this->getJson('/api/announcements')->assertJsonCount(1, 'data');

        $this->actingAs($admin)
            ->deleteJson("/api/admin/announcements/{$announcement->id}")
            ->assertOk();

        $this->getJson('/api/announcements')->assertJsonCount(0, 'data');
    }

    public function test_resolving_a_concern_shows_for_the_student_at_once(): void
    {
        $student = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $concern = Concern::factory()->create(['user_id' => $student->id]);

        $this->actingAs($student)->getJson('/api/concerns')
            ->assertJsonPath('data.0.status', Concern::STATUS_SUBMITTED);

        $this->actingAs($admin)->putJson("/api/admin/concerns/{$concern->id}", [
            'status' => Concern::STATUS_RESOLVED,
        ])->assertOk();

        $this->actingAs($student)->getJson('/api/concerns')
            ->assertJsonPath('data.0.status', Concern::STATUS_RESOLVED);
    }

    public function test_different_filters_do_not_share_a_cached_result(): void
    {
        $student = User::factory()->create();

        Reviewer::factory()->approved()->create(['subject' => 'Database Systems']);
        Reviewer::factory()->approved()->create(['subject' => 'Computer Networks']);

        $this->actingAs($student)->getJson('/api/reviewers')->assertJsonCount(2, 'data');
        $this->actingAs($student)->getJson('/api/reviewers?subject=Database+Systems')->assertJsonCount(1, 'data');
        $this->actingAs($student)->getJson('/api/reviewers?search=nothingmatches')->assertJsonCount(0, 'data');
        $this->actingAs($student)->getJson('/api/reviewers')->assertJsonCount(2, 'data');
    }

    public function test_a_cached_token_still_authenticates_as_the_right_user(): void
    {
        config()->set('sanctum.cache_tokens', true);

        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        foreach (range(1, 3) as $ignored) {
            $this->app['auth']->forgetGuards();

            $this->withHeader('Authorization', "Bearer {$token}")
                ->getJson('/api/user')
                ->assertOk()
                ->assertJsonPath('user.id', $user->id)
                ->assertJsonPath('user.role', 'student');
        }
    }

    public function test_a_cached_token_does_not_grant_another_users_identity(): void
    {
        config()->set('sanctum.cache_tokens', true);

        $alice = User::factory()->create();
        $bob = User::factory()->admin()->create();

        $aliceToken = $alice->createToken('a')->plainTextToken;
        $bobToken = $bob->createToken('b')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$aliceToken}")
            ->getJson('/api/user')->assertJsonPath('user.id', $alice->id);

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$bobToken}")
            ->getJson('/api/user')
            ->assertJsonPath('user.id', $bob->id)
            ->assertJsonPath('user.role', 'admin');
    }

    public function test_logging_out_invalidates_the_cached_token_immediately(): void
    {
        config()->set('sanctum.cache_tokens', true);

        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/user')->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/logout')->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/user')->assertUnauthorized();
    }

    public function test_a_cached_token_keeps_a_student_out_of_admin_endpoints(): void
    {
        config()->set('sanctum.cache_tokens', true);

        $student = User::factory()->create();
        $token = $student->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/user')->assertOk();

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/dashboard')
            ->assertForbidden();
    }

    public function test_last_used_at_is_not_rewritten_on_every_request(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->accessToken;

        $token->forceFill(['last_used_at' => now()->subMinute()])->save();
        $original = $token->fresh()->last_used_at;

        $token->forceFill(['last_used_at' => now()])->save();

        $this->assertEquals(
            $original->timestamp,
            $token->fresh()->last_used_at->timestamp,
            'A recent last_used_at should not be rewritten.'
        );
    }

    public function test_a_stale_last_used_at_is_still_written(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->accessToken;

        $token->forceFill([
            'last_used_at' => now()->subMinutes(PersonalAccessToken::LAST_USED_PRECISION_MINUTES + 5),
        ])->save();

        $token->forceFill(['last_used_at' => now()])->save();

        $this->assertTrue(
            $token->fresh()->last_used_at->gt(now()->subMinute()),
            'A stale last_used_at should be brought up to date.'
        );
    }
}
