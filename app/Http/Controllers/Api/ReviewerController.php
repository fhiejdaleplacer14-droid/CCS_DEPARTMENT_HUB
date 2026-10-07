<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewerRequest;
use App\Http\Resources\ReviewerResource;
use App\Models\Reviewer;
use App\Services\ReviewerScreeningService;
use App\Support\ListCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReviewerController extends Controller
{
    public function __construct(private readonly ReviewerScreeningService $screening)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:150'],
            'subject' => ['nullable', 'string', 'max:255'],
            'year_level' => ['nullable', 'string', 'max:50'],
            'sort' => ['nullable', 'in:newest,oldest,downloads,title'],
            'mine' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return response()->json(ListCache::remember(
            'reviewers',
            $validated + ['page' => $request->integer('page', 1), 'viewer' => $request->user()->id],
            fn () => $this->listPayload($request, $validated),
        ));
    }

    private function listPayload(Request $request, array $validated): array
    {
        $query = Reviewer::query()->with('uploader:id,name');

        if ($request->boolean('mine')) {
            $query->where('uploaded_by', $request->user()->id);
        } else {
            $query->approved();
        }

        $query
            ->search($validated['search'] ?? null)
            ->when($validated['subject'] ?? null, fn ($q, $subject) => $q->where('subject', $subject))
            ->when($validated['year_level'] ?? null, fn ($q, $year) => $q->where('year_level', $year));

        match ($validated['sort'] ?? 'newest') {
            'oldest' => $query->oldest(),
            'downloads' => $query->orderByDesc('download_count')->latest(),
            'title' => $query->orderBy('title'),
            default => $query->latest(),
        };

        return ReviewerResource::collection(
            $query->paginate($validated['per_page'] ?? 12)->withQueryString()
        )->response($request)->getData(true);
    }

    public function show(Request $request, Reviewer $reviewer): ReviewerResource
    {
        $this->authorize('view', $reviewer);

        return new ReviewerResource($reviewer->load('uploader:id,name'));
    }

    public function store(StoreReviewerRequest $request): JsonResponse
    {
        $file = $request->file('file');

        $path = $file->store('reviewers', 'local');

        $reviewer = Reviewer::create([
            'title' => $request->string('title')->trim()->value(),
            'description' => $request->filled('description')
                ? $request->string('description')->trim()->value()
                : null,
            'subject' => $request->string('subject')->value(),
            'year_level' => $request->string('year_level')->value(),
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_mime' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
            'status' => Reviewer::STATUS_PENDING,
        ]);

        $this->screening->screen($reviewer);

        DashboardController::forgetStudent($request->user()->id);
        DashboardController::forgetAdmin();
        ListCache::bump('reviewers');

        return response()->json([
            'message' => $this->statusMessage($reviewer->status),
            'reviewer' => new ReviewerResource($reviewer->load('uploader:id,name')),
        ], 201);
    }

    public function download(Request $request, Reviewer $reviewer): StreamedResponse
    {
        $this->authorize('download', $reviewer);

        abort_unless(Storage::disk('local')->exists($reviewer->file_path), 404, 'The file is no longer available.');

        $reviewer->increment('download_count');

        return Storage::disk('local')->download($reviewer->file_path, $reviewer->file_name);
    }

    public function destroy(Request $request, Reviewer $reviewer): JsonResponse
    {
        $this->authorize('delete', $reviewer);

        Storage::disk('local')->delete($reviewer->file_path);
        $reviewer->delete();

        DashboardController::forgetStudent($reviewer->uploaded_by);
        DashboardController::forgetAdmin();
        ListCache::bump('reviewers');

        return response()->json(['message' => 'Reviewer deleted.']);
    }

    /** Filter options come from config so the frontend stays in step with validation. */
    public function filters(): JsonResponse
    {
        return response()->json([
            'subjects' => config('reviewers.subjects'),
            'year_levels' => config('reviewers.year_levels'),
            'max_file_size_kb' => config('reviewers.max_file_size_kb'),
            'allowed_extensions' => config('reviewers.allowed_extensions'),
        ]);
    }

    private function statusMessage(string $status): string
    {
        return match ($status) {
            Reviewer::STATUS_APPROVED => 'Your reviewer passed AI screening and is now published.',
            Reviewer::STATUS_FLAGGED => 'Your reviewer needs a quick look from an administrator before it is published.',
            Reviewer::STATUS_REJECTED => 'Your upload did not pass screening as academic review material.',
            default => 'Your reviewer was uploaded and is awaiting screening.',
        };
    }
}
