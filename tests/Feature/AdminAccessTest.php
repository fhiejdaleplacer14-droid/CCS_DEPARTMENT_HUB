<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Concern;
use App\Models\Reviewer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<int, array{string, string}> */
    public static function adminEndpoints(): array
    {
        return [
            ['get', '/api/admin/dashboard'],
            ['get', '/api/admin/users'],
            ['get', '/api/admin/reviewers'],
            ['get', '/api/admin/reviewers/flagged'],
            ['get', '/api/admin/concerns'],
        ];
    }

    /**
     * @dataProvider adminEndpoints
     */
    public function test_a_student_is_refused_admin_endpoints(string $method, string $uri): void
    {
        $this->actingAs(User::factory()->create())
            ->json($method, $uri)
            ->assertForbidden()
            ->assertJsonPath('message', 'This area is restricted to department administrators.');
    }

    /**
     * @dataProvider adminEndpoints
     */
    public function test_a_guest_is_refused_admin_endpoints(string $method, string $uri): void
    {
        $this->json($method, $uri)->assertUnauthorized();
    }

    /**
     * @dataProvider adminEndpoints
     */
    public function test_an_administrator_is_allowed_admin_endpoints(string $method, string $uri): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->json($method, $uri)
            ->assertOk();
    }

    public function test_the_admin_dashboard_reports_accurate_counts(): void
    {
        User::factory()->count(3)->create();
        User::factory()->admin()->create();
        Reviewer::factory()->approved()->count(2)->create();
        Reviewer::factory()->flagged()->count(3)->create();
        Reviewer::factory()->pending()->create();
        Concern::factory()->create(['status' => Concern::STATUS_SUBMITTED]);
        Concern::factory()->create(['status' => Concern::STATUS_IN_PROGRESS]);
        Concern::factory()->create(['status' => Concern::STATUS_CLOSED]);

        $expectedStudents = User::where('role', User::ROLE_STUDENT)->count();

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.total_students', $expectedStudents)
            ->assertJsonPath('stats.total_reviewers', 2)
            ->assertJsonPath('stats.needs_review', 4)
            ->assertJsonPath('stats.open_concerns', 2);
    }

    public function test_the_student_dashboard_reports_their_own_totals(): void
    {
        $student = User::factory()->create();

        Reviewer::factory()->approved()->count(3)->create();
        Reviewer::factory()->approved()->count(2)->create(['uploaded_by' => $student->id]);
        Concern::factory()->create(['user_id' => $student->id]);
        Announcement::factory()->count(2)->create();

        $this->actingAs($student)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.my_uploads', 2)
            ->assertJsonPath('stats.my_concerns', 1)
            ->assertJsonPath('stats.announcements', 2)
            ->assertJsonPath('stats.available_reviewers', 5);
    }

    public function test_the_flagged_queue_contains_only_undecided_uploads(): void
    {
        Reviewer::factory()->flagged()->count(2)->create();
        Reviewer::factory()->pending()->create();
        Reviewer::factory()->approved()->create();
        Reviewer::factory()->rejected()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/admin/reviewers/flagged')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_an_administrator_can_approve_a_flagged_reviewer(): void
    {
        $admin = User::factory()->admin()->create();
        $reviewer = Reviewer::factory()->flagged()->create();

        $this->actingAs($admin)
            ->putJson("/api/admin/reviewers/{$reviewer->id}/status", ['status' => 'APPROVED'])
            ->assertOk()
            ->assertJsonPath('reviewer.status', Reviewer::STATUS_APPROVED);

        $reviewer->refresh();
        $this->assertSame($admin->id, $reviewer->reviewed_by);
        $this->assertNotNull($reviewer->reviewed_at);
    }

    public function test_an_administrator_can_reject_a_flagged_reviewer(): void
    {
        $reviewer = Reviewer::factory()->flagged()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->putJson("/api/admin/reviewers/{$reviewer->id}/status", ['status' => 'REJECTED'])
            ->assertOk();

        $this->assertSame(Reviewer::STATUS_REJECTED, $reviewer->fresh()->status);
    }

    public function test_an_approved_reviewer_becomes_publicly_listed(): void
    {
        $reviewer = Reviewer::factory()->flagged()->create();
        $student = User::factory()->create();

        $this->actingAs($student)->getJson('/api/reviewers')->assertJsonCount(0, 'data');

        $this->actingAs(User::factory()->admin()->create())
            ->putJson("/api/admin/reviewers/{$reviewer->id}/status", ['status' => 'APPROVED'])
            ->assertOk();

        $this->actingAs($student)->getJson('/api/reviewers')->assertJsonCount(1, 'data');
    }

    public function test_a_moderation_status_must_be_valid(): void
    {
        $reviewer = Reviewer::factory()->flagged()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->putJson("/api/admin/reviewers/{$reviewer->id}/status", ['status' => 'PENDING'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_a_student_cannot_moderate(): void
    {
        $reviewer = Reviewer::factory()->flagged()->create();

        $this->actingAs(User::factory()->create())
            ->putJson("/api/admin/reviewers/{$reviewer->id}/status", ['status' => 'APPROVED'])
            ->assertForbidden();

        $this->assertSame(Reviewer::STATUS_FLAGGED, $reviewer->fresh()->status);
    }

    public function test_the_admin_library_lists_every_status_with_counts(): void
    {
        Reviewer::factory()->approved()->count(2)->create();
        Reviewer::factory()->flagged()->create();
        Reviewer::factory()->rejected()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/admin/reviewers')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('meta_counts.APPROVED', 2)
            ->assertJsonPath('meta_counts.FLAGGED', 1)
            ->assertJsonPath('meta_counts.REJECTED', 1);
    }

    public function test_the_user_list_can_be_searched_and_filtered(): void
    {
        User::factory()->create(['name' => 'Ana Reyes', 'email' => 'ana@school.edu']);
        User::factory()->create(['name' => 'Ben Cruz', 'email' => 'ben@school.edu']);
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->getJson('/api/admin/users?search=ana')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Ana Reyes');

        $this->actingAs($admin)
            ->getJson('/api/admin/users?role=admin')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_the_user_list_never_exposes_password_hashes(): void
    {
        User::factory()->count(2)->create();

        $response = $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/admin/users')
            ->assertOk();

        $this->assertStringNotContainsString('password', $response->getContent());
    }
}
