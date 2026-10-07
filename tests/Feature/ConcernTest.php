<?php

namespace Tests\Feature;

use App\Models\Concern;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ConcernTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Internet Connection Problem',
            'category' => 'Internet',
            'description' => 'The wifi in the laboratory keeps disconnecting during class.',
            'location' => 'Computer Laboratory 2',
        ], $overrides);
    }

    public function test_a_student_can_submit_a_concern(): void
    {
        $student = User::factory()->create();

        $this->actingAs($student)
            ->postJson('/api/concerns', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('concern.status', Concern::STATUS_SUBMITTED)
            ->assertJsonPath('concern.title', 'Internet Connection Problem');

        $this->assertDatabaseHas('concerns', [
            'user_id' => $student->id,
            'status' => Concern::STATUS_SUBMITTED,
        ]);
    }

    public function test_a_concern_can_be_submitted_with_an_attachment(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/concerns', $this->validPayload([
                'attachment' => UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg'),
            ]))
            ->assertCreated()
            ->assertJsonPath('concern.has_attachment', true);

        Storage::disk('local')->assertExists(Concern::first()->attachment_path);
    }

    public function test_submitting_requires_the_mandatory_fields(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/concerns', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'category', 'description']);
    }

    public function test_an_unknown_category_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/concerns', $this->validPayload(['category' => 'Nonsense']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('category');
    }

    public function test_a_disallowed_attachment_type_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/concerns', $this->validPayload([
                'attachment' => UploadedFile::fake()->create('script.exe', 10, 'application/pdf'),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('attachment');
    }

    public function test_an_oversized_attachment_is_rejected(): void
    {
        config()->set('concerns.max_attachment_size_kb', 50);

        $this->actingAs(User::factory()->create())
            ->postJson('/api/concerns', $this->validPayload([
                'attachment' => UploadedFile::fake()->create('big.pdf', 200, 'application/pdf'),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('attachment');
    }

    public function test_a_student_only_sees_their_own_concerns(): void
    {
        $student = User::factory()->create();

        Concern::factory()->count(2)->create(['user_id' => $student->id]);
        Concern::factory()->count(3)->create();

        $this->actingAs($student)
            ->getJson('/api/concerns')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_an_administrator_sees_every_concern(): void
    {
        Concern::factory()->count(4)->create();

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/concerns')
            ->assertOk()
            ->assertJsonCount(4, 'data');
    }

    public function test_concerns_can_be_filtered_by_status(): void
    {
        $student = User::factory()->create();

        Concern::factory()->create(['user_id' => $student->id, 'status' => Concern::STATUS_RESOLVED]);
        Concern::factory()->create(['user_id' => $student->id, 'status' => Concern::STATUS_SUBMITTED]);

        $this->actingAs($student)
            ->getJson('/api/concerns?status=RESOLVED')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_a_student_cannot_read_another_students_concern(): void
    {
        $concern = Concern::factory()->create();

        $this->actingAs(User::factory()->create())
            ->getJson("/api/concerns/{$concern->id}")
            ->assertForbidden();
    }

    public function test_a_student_can_read_their_own_concern(): void
    {
        $student = User::factory()->create();
        $concern = Concern::factory()->create(['user_id' => $student->id]);

        $this->actingAs($student)
            ->getJson("/api/concerns/{$concern->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $concern->id);
    }

    public function test_a_student_cannot_download_another_students_attachment(): void
    {
        $concern = Concern::factory()->create([
            'attachment_path' => 'concerns/photo.jpg',
            'attachment_name' => 'photo.jpg',
        ]);

        Storage::disk('local')->put('concerns/photo.jpg', 'bytes');

        $this->actingAs(User::factory()->create())
            ->getJson("/api/concerns/{$concern->id}/attachment")
            ->assertForbidden();
    }

    public function test_the_owner_can_download_their_attachment(): void
    {
        $student = User::factory()->create();
        $concern = Concern::factory()->create([
            'user_id' => $student->id,
            'attachment_path' => 'concerns/photo.jpg',
            'attachment_name' => 'photo.jpg',
        ]);

        Storage::disk('local')->put('concerns/photo.jpg', 'bytes');

        $this->actingAs($student)
            ->get("/api/concerns/{$concern->id}/attachment")
            ->assertOk()
            ->assertDownload('photo.jpg');
    }

    public function test_an_administrator_can_advance_the_status(): void
    {
        $concern = Concern::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->putJson("/api/admin/concerns/{$concern->id}", [
                'status' => Concern::STATUS_IN_PROGRESS,
                'admin_response' => 'Maintenance has been notified.',
            ])
            ->assertOk()
            ->assertJsonPath('concern.status', Concern::STATUS_IN_PROGRESS)
            ->assertJsonPath('concern.admin_response', 'Maintenance has been notified.');
    }

    public function test_resolving_a_concern_records_the_time(): void
    {
        $concern = Concern::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->putJson("/api/admin/concerns/{$concern->id}", ['status' => Concern::STATUS_RESOLVED])
            ->assertOk();

        $this->assertNotNull($concern->fresh()->resolved_at);
    }

    public function test_reopening_a_concern_clears_the_resolved_time(): void
    {
        $concern = Concern::factory()->create([
            'status' => Concern::STATUS_RESOLVED,
            'resolved_at' => now(),
        ]);

        $this->actingAs(User::factory()->admin()->create())
            ->putJson("/api/admin/concerns/{$concern->id}", ['status' => Concern::STATUS_IN_PROGRESS])
            ->assertOk();

        $this->assertNull($concern->fresh()->resolved_at);
    }

    public function test_an_invalid_status_is_rejected(): void
    {
        $concern = Concern::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->putJson("/api/admin/concerns/{$concern->id}", ['status' => 'BANANA'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_a_student_cannot_change_a_status_even_on_their_own_concern(): void
    {
        $student = User::factory()->create();
        $concern = Concern::factory()->create(['user_id' => $student->id]);

        $this->actingAs($student)
            ->putJson("/api/admin/concerns/{$concern->id}", ['status' => Concern::STATUS_RESOLVED])
            ->assertForbidden();

        $this->assertSame(Concern::STATUS_SUBMITTED, $concern->fresh()->status);
    }

    public function test_the_form_options_are_available(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/concerns/categories')
            ->assertOk()
            ->assertJsonStructure(['categories', 'statuses'])
            ->assertJsonPath('categories.0', 'Classroom');
    }
}
