<?php

namespace Tests\Feature;

use App\Models\Reviewer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReviewerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        config()->set('gemini.api_key', 'test-key');

        Http::fake([
            '*' => Http::response([
                'candidates' => [['content' => ['parts' => [['text' => json_encode([
                    'is_reviewer' => true,
                    'confidence' => 0.95,
                    'subject' => 'Database Systems',
                    'topics' => ['SQL'],
                    'quality' => 'good',
                    'decision' => 'approve',
                    'reason' => 'Study material.',
                ])]]]]],
            ]),
        ]);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Database Systems Reviewer',
            'description' => 'Covers normalization and SQL.',
            'subject' => 'Database Systems',
            'year_level' => '1st Year',
            'file' => UploadedFile::fake()->create('reviewer.pdf', 120, 'application/pdf'),
        ], $overrides);
    }

    public function test_only_approved_reviewers_are_listed(): void
    {
        Reviewer::factory()->approved()->count(3)->create();
        Reviewer::factory()->flagged()->create();
        Reviewer::factory()->rejected()->create();
        Reviewer::factory()->pending()->create();

        $this->actingAs(User::factory()->create())
            ->getJson('/api/reviewers')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_a_student_sees_every_status_among_their_own_uploads(): void
    {
        $student = User::factory()->create();

        Reviewer::factory()->approved()->create(['uploaded_by' => $student->id]);
        Reviewer::factory()->flagged()->create(['uploaded_by' => $student->id]);
        Reviewer::factory()->rejected()->create(['uploaded_by' => $student->id]);
        Reviewer::factory()->approved()->create(); // someone else's

        $this->actingAs($student)
            ->getJson('/api/reviewers?mine=1')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_reviewers_can_be_searched_by_title(): void
    {
        Reviewer::factory()->approved()->create(['title' => 'Database Normalization Guide']);
        Reviewer::factory()->approved()->create(['title' => 'Computer Networks Primer']);

        $this->actingAs(User::factory()->create())
            ->getJson('/api/reviewers?search=normalization')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Database Normalization Guide');
    }

    public function test_reviewers_can_be_filtered_by_subject_and_year_level(): void
    {
        Reviewer::factory()->approved()->create(['subject' => 'Database Systems', 'year_level' => '1st Year']);
        Reviewer::factory()->approved()->create(['subject' => 'Database Systems', 'year_level' => '3rd Year']);
        Reviewer::factory()->approved()->create(['subject' => 'Operating Systems', 'year_level' => '1st Year']);

        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/reviewers?subject=Database+Systems')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($user)
            ->getJson('/api/reviewers?subject=Database+Systems&year_level=1st+Year')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_reviewers_can_be_sorted_by_downloads(): void
    {
        Reviewer::factory()->approved()->create(['title' => 'Quiet', 'download_count' => 2]);
        Reviewer::factory()->approved()->create(['title' => 'Popular', 'download_count' => 99]);

        $this->actingAs(User::factory()->create())
            ->getJson('/api/reviewers?sort=downloads')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Popular');
    }

    public function test_the_list_is_paginated(): void
    {
        Reviewer::factory()->approved()->count(15)->create();

        $this->actingAs(User::factory()->create())
            ->getJson('/api/reviewers?per_page=5')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 15)
            ->assertJsonPath('meta.last_page', 3);
    }

    public function test_an_invalid_sort_option_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/reviewers?sort=rubbish')
            ->assertStatus(422);
    }

    public function test_a_student_can_upload_a_reviewer(): void
    {
        $student = User::factory()->create();

        $this->actingAs($student)
            ->postJson('/api/reviewers', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('reviewer.title', 'Database Systems Reviewer');

        $reviewer = Reviewer::first();
        $this->assertSame($student->id, $reviewer->uploaded_by);
        Storage::disk('local')->assertExists($reviewer->file_path);
    }

    public function test_the_original_filename_is_preserved_for_download(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/reviewers', $this->validPayload([
                'file' => UploadedFile::fake()->create('My Study Notes.pdf', 50, 'application/pdf'),
            ]))
            ->assertCreated();

        $this->assertSame('My Study Notes.pdf', Reviewer::first()->file_name);
    }

    public function test_uploading_requires_the_mandatory_fields(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/reviewers', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'subject', 'year_level', 'file']);
    }

    public function test_an_unapproved_subject_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/reviewers', $this->validPayload(['subject' => 'Astrology']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('subject');
    }

    public function test_an_executable_disguised_as_a_document_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/reviewers', $this->validPayload([
                'file' => UploadedFile::fake()->create('payload.exe', 20, 'text/plain'),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');

        $this->assertDatabaseCount('reviewers', 0);
    }

    public function test_an_oversized_file_is_rejected(): void
    {
        config()->set('reviewers.max_file_size_kb', 100);

        $this->actingAs(User::factory()->create())
            ->postJson('/api/reviewers', $this->validPayload([
                'file' => UploadedFile::fake()->create('huge.pdf', 500, 'application/pdf'),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    public function test_a_guest_cannot_upload(): void
    {
        $this->postJson('/api/reviewers', $this->validPayload())->assertUnauthorized();
    }

    public function test_an_approved_reviewer_can_be_downloaded_and_the_counter_increments(): void
    {
        $reviewer = Reviewer::factory()->approved()->create([
            'file_path' => 'reviewers/notes.pdf',
            'file_name' => 'notes.pdf',
            'download_count' => 0,
        ]);

        Storage::disk('local')->put('reviewers/notes.pdf', 'pdf bytes');

        $this->actingAs(User::factory()->create())
            ->get("/api/reviewers/{$reviewer->id}/download")
            ->assertOk()
            ->assertDownload('notes.pdf');

        $this->assertSame(1, $reviewer->fresh()->download_count);
    }

    public function test_an_unapproved_reviewer_cannot_be_downloaded_by_a_student(): void
    {
        $owner = User::factory()->create();
        $reviewer = Reviewer::factory()->flagged()->create(['uploaded_by' => $owner->id]);

        // Not even by the student who uploaded it.
        $this->actingAs($owner)
            ->getJson("/api/reviewers/{$reviewer->id}/download")
            ->assertForbidden();
    }

    public function test_an_administrator_can_download_an_unapproved_reviewer(): void
    {
        $reviewer = Reviewer::factory()->flagged()->create([
            'file_path' => 'reviewers/held.pdf',
            'file_name' => 'held.pdf',
        ]);

        Storage::disk('local')->put('reviewers/held.pdf', 'pdf bytes');

        $this->actingAs(User::factory()->admin()->create())
            ->get("/api/reviewers/{$reviewer->id}/download")
            ->assertOk();
    }

    public function test_a_missing_file_returns_a_clean_404(): void
    {
        $reviewer = Reviewer::factory()->approved()->create(['file_path' => 'reviewers/gone.pdf']);

        $this->actingAs(User::factory()->create())
            ->getJson("/api/reviewers/{$reviewer->id}/download")
            ->assertNotFound()
            ->assertJsonPath('message', 'The file is no longer available.');
    }

    public function test_a_student_cannot_view_another_students_unapproved_upload(): void
    {
        $reviewer = Reviewer::factory()->flagged()->create();

        $this->actingAs(User::factory()->create())
            ->getJson("/api/reviewers/{$reviewer->id}")
            ->assertForbidden();
    }

    public function test_a_student_can_view_their_own_unapproved_upload(): void
    {
        $owner = User::factory()->create();
        $reviewer = Reviewer::factory()->flagged()->create(['uploaded_by' => $owner->id]);

        $this->actingAs($owner)
            ->getJson("/api/reviewers/{$reviewer->id}")
            ->assertOk();
    }

    public function test_the_ai_breakdown_is_hidden_from_other_students(): void
    {
        $reviewer = Reviewer::factory()->approved()->create([
            'ai_decision' => 'approve',
            'ai_confidence' => 0.91,
            'ai_reason' => 'Internal screening note.',
        ]);

        $this->actingAs(User::factory()->create())
            ->getJson("/api/reviewers/{$reviewer->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.ai');
    }

    public function test_the_ai_breakdown_is_visible_to_the_uploader(): void
    {
        $owner = User::factory()->create();
        $reviewer = Reviewer::factory()->approved()->create([
            'uploaded_by' => $owner->id,
            'ai_decision' => 'approve',
            'ai_confidence' => 0.91,
            'ai_reason' => 'Looks like study material.',
        ]);

        $this->actingAs($owner)
            ->getJson("/api/reviewers/{$reviewer->id}")
            ->assertOk()
            ->assertJsonPath('data.ai.confidence', 0.91);
    }

    public function test_a_student_can_delete_their_own_upload(): void
    {
        $owner = User::factory()->create();
        $reviewer = Reviewer::factory()->create([
            'uploaded_by' => $owner->id,
            'file_path' => 'reviewers/mine.pdf',
        ]);

        Storage::disk('local')->put('reviewers/mine.pdf', 'bytes');

        $this->actingAs($owner)
            ->deleteJson("/api/reviewers/{$reviewer->id}")
            ->assertOk();

        $this->assertDatabaseCount('reviewers', 0);
        Storage::disk('local')->assertMissing('reviewers/mine.pdf');
    }

    public function test_a_student_cannot_delete_someone_elses_upload(): void
    {
        $reviewer = Reviewer::factory()->create();

        $this->actingAs(User::factory()->create())
            ->deleteJson("/api/reviewers/{$reviewer->id}")
            ->assertForbidden();

        $this->assertDatabaseCount('reviewers', 1);
    }

    public function test_an_administrator_can_delete_any_upload(): void
    {
        $reviewer = Reviewer::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->deleteJson("/api/reviewers/{$reviewer->id}")
            ->assertOk();
    }

    public function test_a_missing_reviewer_returns_a_generic_404(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/reviewers/9999')
            ->assertNotFound()
            ->assertExactJson(['message' => 'The requested item could not be found.']);
    }

    public function test_the_filter_options_are_public(): void
    {
        $this->getJson('/api/reviewers/filters')
            ->assertOk()
            ->assertJsonStructure(['subjects', 'year_levels', 'max_file_size_kb', 'allowed_extensions']);
    }
}
