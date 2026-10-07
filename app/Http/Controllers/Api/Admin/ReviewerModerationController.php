<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateReviewerStatusRequest;
use App\Http\Resources\ReviewerResource;
use App\Models\Reviewer;
use App\Services\ReviewerScreeningService;
use App\Support\ListCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReviewerModerationController extends Controller
{
    
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:150'],
            'status' => ['nullable', 'string', 'max:20'],
            'subject' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $reviewers = Reviewer::query()
            ->with(['uploader:id,name', 'reviewer:id,name'])
            ->search($validated['search'] ?? null)
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($validated['subject'] ?? null, fn ($q, $subject) => $q->where('subject', $subject))
            ->latest()
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        return ReviewerResource::collection($reviewers)->additional([
            'meta_counts' => $this->statusCounts(),
        ]);
    }

    public function flagged(Request $request): AnonymousResourceCollection
    {
        $reviewers = Reviewer::query()
            ->with('uploader:id,name')
            ->whereIn('status', [Reviewer::STATUS_FLAGGED, Reviewer::STATUS_PENDING])
            ->oldest()
            ->paginate((int) $request->integer('per_page', 10));

        return ReviewerResource::collection($reviewers)->additional([
            'meta_counts' => $this->statusCounts(),
        ]);
    }

    public function updateStatus(UpdateReviewerStatusRequest $request, Reviewer $reviewer): JsonResponse
    {
        $this->authorize('moderate', Reviewer::class);

        $reviewer->update([
            'status' => $request->string('status')->value(),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        ListCache::bump('reviewers');
        \App\Http\Controllers\Api\DashboardController::forgetAdmin();

        return response()->json([
            'message' => 'Reviewer marked as '.strtolower($reviewer->status).'.',
            'reviewer' => new ReviewerResource($reviewer->load(['uploader:id,name', 'reviewer:id,name'])),
        ]);
    }

    public function rescreen(Request $request, Reviewer $reviewer, ReviewerScreeningService $screening): JsonResponse
    {
        $this->authorize('moderate', Reviewer::class);

        $screening->screen($reviewer);

        ListCache::bump('reviewers');
        \App\Http\Controllers\Api\DashboardController::forgetAdmin();

        return response()->json([
            'message' => 'AI screening re-run for this reviewer.',
            'reviewer' => new ReviewerResource($reviewer->load('uploader:id,name')),
        ]);
    }

    /** @return array<string, int> */
    private function statusCounts(): array
    {
        $counts = Reviewer::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return collect(Reviewer::STATUSES)
            ->mapWithKeys(fn (string $status) => [$status => (int) ($counts[$status] ?? 0)])
            ->all();
    }
}
