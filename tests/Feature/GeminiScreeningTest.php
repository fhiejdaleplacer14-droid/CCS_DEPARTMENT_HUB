<?php

namespace Tests\Feature;

use App\Models\Reviewer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GeminiScreeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        config()->set('gemini.api_key', 'test-key');
        config()->set('gemini.thresholds.approve', 0.85);
        config()->set('gemini.thresholds.flag', 0.55);
        config()->set('gemini.fallback_status', 'FLAGGED');
    }

    private function fakeGemini(array $analysis): void
    {
        Http::fake([
            '*generativelanguage.googleapis.com*' => Http::response([
                'candidates' => [
                    ['content' => ['parts' => [['text' => json_encode($analysis)]]]],
                ],
            ]),
        ]);
    }

    private function upload(?User $student = null): \Illuminate\Testing\TestResponse
    {
        $student ??= User::factory()->create();

        return $this->actingAs($student)->postJson('/api/reviewers', [
            'title' => 'Database Systems Reviewer',
            'description' => 'Covers normalization and SQL.',
            'subject' => 'Database Systems',
            'year_level' => '1st Year',
            'file' => UploadedFile::fake()->create('reviewer.pdf', 120, 'application/pdf'),
        ]);
    }

    public function test_a_high_confidence_reviewer_is_approved(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.94,
            'subject' => 'Database Systems',
            'year_level' => '1st Year',
            'topics' => ['SQL', 'Normalization', 'Relational Algebra'],
            'quality' => 'good',
            'decision' => 'approve',
            'reason' => 'The document contains educational review material.',
        ]);

        $this->upload()
            ->assertCreated()
            ->assertJsonPath('reviewer.status', Reviewer::STATUS_APPROVED)
            ->assertJsonPath('reviewer.ai.confidence', 0.94)
            ->assertJsonPath('reviewer.topics', ['SQL', 'Normalization', 'Relational Algebra']);

        $reviewer = Reviewer::first();
        $this->assertSame('approve', $reviewer->ai_decision);
        $this->assertSame('good', $reviewer->ai_quality);
        $this->assertNotNull($reviewer->ai_analyzed_at);
    }

    public function test_a_medium_confidence_reviewer_is_flagged(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.7,
            'topics' => [],
            'quality' => 'fair',
            'decision' => 'approve',
            'reason' => 'Probably study material but hard to confirm.',
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);
    }

    public function test_a_low_confidence_reviewer_is_rejected(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.2,
            'topics' => [],
            'decision' => 'approve',
            'reason' => 'Unclear whether this is study material.',
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_REJECTED);
    }

    public function test_a_document_that_is_confidently_not_a_reviewer_is_rejected(): void
    {
        $this->fakeGemini([
            'is_reviewer' => false,
            'confidence' => 0.97,
            'topics' => [],
            'decision' => 'reject',
            'reason' => 'The document is a personal resume, not review material.',
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_REJECTED);
    }

    public function test_an_explicit_review_recommendation_always_flags(): void
    {
     
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.99,
            'topics' => [],
            'decision' => 'review',
            'reason' => 'Looks academic but contains some unverifiable claims.',
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);
    }

    public function test_a_reject_recommendation_wins_over_high_confidence(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.95,
            'topics' => [],
            'decision' => 'reject',
            'reason' => 'Contains inappropriate content for a school library.',
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_REJECTED);
    }

    public function test_an_uncertain_negative_is_flagged_rather_than_rejected(): void
    {
       
        $this->fakeGemini([
            'is_reviewer' => false,
            'confidence' => 0.3,
            'topics' => [],
            'decision' => 'reject',
            'reason' => 'Hard to tell what this document is.',
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);
    }

    public function test_the_thresholds_are_configurable(): void
    {
        config()->set('gemini.thresholds.approve', 0.6);

        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.7,
            'topics' => [],
            'decision' => 'approve',
            'reason' => 'Study material.',
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_APPROVED);
    }

    public function test_the_api_key_is_never_sent_to_the_client(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.9,
            'topics' => [],
            'decision' => 'approve',
            'reason' => 'Study material.',
        ]);

        $response = $this->upload()->assertCreated();

        $this->assertStringNotContainsString('test-key', $response->getContent());
    }

    public function test_the_key_is_sent_to_gemini_as_a_query_parameter(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.9,
            'topics' => [],
            'decision' => 'approve',
            'reason' => 'Study material.',
        ]);

        $this->upload()->assertCreated();

        Http::assertSent(fn (Request $request) => str_contains($request->url(), 'key=test-key'));
    }

    public function test_an_unconfigured_api_key_falls_back_to_manual_review(): void
    {
        config()->set('gemini.api_key', null);
        Http::fake();

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);

        Http::assertNothingSent();

        $reviewer = Reviewer::first();
        $this->assertNull($reviewer->ai_decision);
        $this->assertStringContainsString('not configured', $reviewer->ai_reason);
    }

    public function test_a_network_failure_falls_back_to_manual_review(): void
    {
        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('Connection timed out'));

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);

        $this->assertNull(Reviewer::first()->ai_decision);
    }

    public function test_a_gemini_server_error_falls_back_to_manual_review(): void
    {
        Http::fake(['*' => Http::response(['error' => 'quota exceeded'], 429)]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);
    }

    public function test_a_non_json_reply_falls_back_to_manual_review(): void
    {
        Http::fake([
            '*' => Http::response([
                'candidates' => [['content' => ['parts' => [['text' => 'I am not JSON at all.']]]]],
            ]),
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);
    }

    public function test_a_reply_missing_required_keys_falls_back_to_manual_review(): void
    {
        $this->fakeGemini(['quality' => 'good', 'reason' => 'No verdict given.']);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);
    }

    public function test_an_empty_response_falls_back_to_manual_review(): void
    {
        Http::fake(['*' => Http::response(['candidates' => []])]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);
    }

    public function test_an_overloaded_model_is_retried_and_can_then_succeed(): void
    {
        $success = [
            'candidates' => [['content' => ['parts' => [['text' => json_encode([
                'is_reviewer' => true,
                'confidence' => 0.93,
                'topics' => ['SQL'],
                'decision' => 'approve',
                'reason' => 'Study material.',
            ])]]]]],
        ];

        Http::fake([
            '*' => Http::sequence()
                ->push(['error' => ['code' => 503, 'status' => 'UNAVAILABLE']], 503)
                ->push(['error' => ['code' => 503, 'status' => 'UNAVAILABLE']], 503)
                ->push($success, 200),
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_APPROVED);

        Http::assertSentCount(3);
    }

    public function test_rate_limiting_is_retried(): void
    {
        $success = [
            'candidates' => [['content' => ['parts' => [['text' => json_encode([
                'is_reviewer' => true,
                'confidence' => 0.91,
                'topics' => [],
                'decision' => 'approve',
                'reason' => 'Study material.',
            ])]]]]],
        ];

        Http::fake([
            '*' => Http::sequence()
                ->push(['error' => ['code' => 429]], 429)
                ->push($success, 200),
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_APPROVED);

        Http::assertSentCount(2);
    }

    public function test_a_persistent_overload_gives_up_and_falls_back(): void
    {
        config()->set('gemini.retry_times', 3);

        Http::fake(['*' => Http::response(['error' => ['code' => 503]], 503)]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);

        Http::assertSentCount(3);
    }

    public function test_a_rejected_key_is_not_retried(): void
    {
        config()->set('gemini.retry_times', 4);

        Http::fake(['*' => Http::response(['error' => ['message' => 'API key not valid']], 400)]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);

        Http::assertSentCount(1);
    }

    public function test_thinking_config_is_omitted_unless_configured(): void
    {
     
        config()->set('gemini.thinking_budget', null);

        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.9,
            'topics' => [],
            'decision' => 'approve',
            'reason' => 'Study material.',
        ]);

        $this->upload()->assertCreated();

        Http::assertSent(fn (Request $request) => ! isset($request->data()['generationConfig']['thinkingConfig']));
    }

    public function test_thinking_config_is_sent_when_configured(): void
    {
        config()->set('gemini.thinking_budget', 0);

        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.9,
            'topics' => [],
            'decision' => 'approve',
            'reason' => 'Study material.',
        ]);

        $this->upload()->assertCreated();

        Http::assertSent(
            fn (Request $request) => ($request->data()['generationConfig']['thinkingConfig']['thinkingBudget'] ?? null) === 0
        );
    }

    public function test_a_truncated_reply_explains_the_output_budget(): void
    {
        
        Http::fake([
            '*' => Http::response([
                'candidates' => [['content' => ['parts' => []], 'finishReason' => 'MAX_TOKENS']],
                'usageMetadata' => ['thoughtsTokenCount' => 2048],
            ]),
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);

        $this->assertStringContainsString('output budget', Reviewer::first()->ai_reason);
    }

    public function test_a_json_reply_wrapped_in_a_markdown_fence_is_still_parsed(): void
    {
        $json = json_encode([
            'is_reviewer' => true,
            'confidence' => 0.92,
            'topics' => ['SQL'],
            'decision' => 'approve',
            'reason' => 'Study material.',
        ]);

        Http::fake([
            '*' => Http::response([
                'candidates' => [['content' => ['parts' => [['text' => "```json\n{$json}\n```"]]]]],
            ]),
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_APPROVED);
    }

    public function test_an_out_of_range_confidence_is_clamped(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 7.5,
            'topics' => [],
            'decision' => 'approve',
            'reason' => 'Study material.',
        ]);

        $this->upload()->assertCreated();

        $this->assertSame(1.0, Reviewer::first()->ai_confidence);
    }

    public function test_a_non_numeric_confidence_falls_back_to_manual_review(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 'very sure',
            'topics' => [],
            'decision' => 'approve',
            'reason' => 'Study material.',
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);
    }

    public function test_an_invalid_decision_value_is_treated_as_needing_review(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.95,
            'topics' => [],
            'decision' => 'definitely-publish-it',
            'reason' => 'Study material.',
        ]);

        $this->upload()->assertCreated()->assertJsonPath('reviewer.status', Reviewer::STATUS_FLAGGED);
    }

    public function test_html_in_the_ai_reason_is_stripped(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.9,
            'topics' => ['<script>alert(1)</script>SQL'],
            'decision' => 'approve',
            'reason' => '<script>alert("xss")</script>Looks like study material.',
        ]);

        $this->upload()->assertCreated();

        $reviewer = Reviewer::first();
        $this->assertStringNotContainsString('<script>', $reviewer->ai_reason);
        $this->assertStringNotContainsString('<script>', $reviewer->ai_topics[0]);
    }

    public function test_the_topic_list_is_capped(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.9,
            'topics' => ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
            'decision' => 'approve',
            'reason' => 'Study material.',
        ]);

        $this->upload()->assertCreated();

        $this->assertCount(6, Reviewer::first()->ai_topics);
    }

    public function test_malformed_topics_are_discarded(): void
    {
        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.9,
            'topics' => 'not-an-array',
            'decision' => 'approve',
            'reason' => 'Study material.',
        ]);

        $this->upload()->assertCreated();

        $this->assertSame([], Reviewer::first()->ai_topics);
    }

    public function test_an_administrator_can_re_run_screening(): void
    {
        $admin = User::factory()->admin()->create();
        $reviewer = Reviewer::factory()->flagged()->create([
            'file_path' => 'reviewers/doc.pdf',
            'file_name' => 'doc.pdf',
        ]);

        Storage::disk('local')->put('reviewers/doc.pdf', 'pdf bytes');

        $this->fakeGemini([
            'is_reviewer' => true,
            'confidence' => 0.96,
            'topics' => ['SQL'],
            'decision' => 'approve',
            'reason' => 'Clearly study material on a second pass.',
        ]);

        $this->actingAs($admin)
            ->postJson("/api/admin/reviewers/{$reviewer->id}/rescreen")
            ->assertOk()
            ->assertJsonPath('reviewer.status', Reviewer::STATUS_APPROVED);
    }

    public function test_a_student_cannot_re_run_screening(): void
    {
        $student = User::factory()->create();
        $reviewer = Reviewer::factory()->flagged()->create();

        $this->actingAs($student)
            ->postJson("/api/admin/reviewers/{$reviewer->id}/rescreen")
            ->assertForbidden();
    }
}
