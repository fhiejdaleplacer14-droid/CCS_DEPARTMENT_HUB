<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementTest extends TestCase
{
    use RefreshDatabase;

    public function test_announcements_are_readable_without_an_account(): void
    {
        Announcement::factory()->count(3)->create();

        $this->getJson('/api/announcements')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_announcements_are_listed_newest_first(): void
    {
        $older = Announcement::factory()->create(['created_at' => now()->subWeek()]);
        $newer = Announcement::factory()->create(['created_at' => now()]);

        $this->getJson('/api/announcements')
            ->assertOk()
            ->assertJsonPath('data.0.id', $newer->id)
            ->assertJsonPath('data.1.id', $older->id);
    }

    public function test_a_single_announcement_can_be_read(): void
    {
        $announcement = Announcement::factory()->create(['title' => 'Examination Schedule']);

        $this->getJson("/api/announcements/{$announcement->id}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Examination Schedule');
    }

    public function test_an_administrator_can_publish_an_announcement(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->postJson('/api/admin/announcements', [
                'title' => 'Midterm Examination Schedule',
                'content' => 'The schedule is now posted on the department board.',
            ])
            ->assertCreated()
            ->assertJsonPath('announcement.title', 'Midterm Examination Schedule');

        $this->assertDatabaseHas('announcements', [
            'title' => 'Midterm Examination Schedule',
            'created_by' => $admin->id,
        ]);
    }

    public function test_publishing_requires_a_title_and_content(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->postJson('/api/admin/announcements', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'content']);
    }

    public function test_a_student_cannot_publish_an_announcement(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/admin/announcements', [
                'title' => 'Fake notice from a student',
                'content' => 'Students should not be able to publish this.',
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('announcements', 0);
    }

    public function test_a_guest_cannot_publish_an_announcement(): void
    {
        $this->postJson('/api/admin/announcements', [
            'title' => 'Anonymous notice',
            'content' => 'This must never be published.',
        ])->assertUnauthorized();
    }

    public function test_an_administrator_can_edit_an_announcement(): void
    {
        $announcement = Announcement::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->putJson("/api/admin/announcements/{$announcement->id}", [
                'title' => 'Updated Examination Schedule',
                'content' => 'The examination schedule has been revised.',
            ])
            ->assertOk()
            ->assertJsonPath('announcement.title', 'Updated Examination Schedule');
    }

    public function test_a_student_cannot_edit_an_announcement(): void
    {
        $announcement = Announcement::factory()->create(['title' => 'Original']);

        $this->actingAs(User::factory()->create())
            ->putJson("/api/admin/announcements/{$announcement->id}", [
                'title' => 'Tampered',
                'content' => 'This should not be saved at all.',
            ])
            ->assertForbidden();

        $this->assertSame('Original', $announcement->fresh()->title);
    }

    public function test_an_administrator_can_delete_an_announcement(): void
    {
        $announcement = Announcement::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->deleteJson("/api/admin/announcements/{$announcement->id}")
            ->assertOk();

        $this->assertDatabaseCount('announcements', 0);
    }

    public function test_a_student_cannot_delete_an_announcement(): void
    {
        $announcement = Announcement::factory()->create();

        $this->actingAs(User::factory()->create())
            ->deleteJson("/api/admin/announcements/{$announcement->id}")
            ->assertForbidden();

        $this->assertDatabaseCount('announcements', 1);
    }

    public function test_a_missing_announcement_returns_a_generic_404(): void
    {
        $this->getJson('/api/announcements/9999')
            ->assertNotFound()
            ->assertExactJson(['message' => 'The requested item could not be found.']);
    }
}
