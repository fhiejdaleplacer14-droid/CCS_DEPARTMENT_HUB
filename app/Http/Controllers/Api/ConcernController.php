<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreConcernRequest;
use App\Http\Resources\ConcernResource;
use App\Models\Concern;
use App\Support\ListCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ConcernController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:20'],
            'category' => ['nullable', 'string', 'max:60'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return response()->json(ListCache::remember(
            'concerns',
            $validated + ['page' => $request->integer('page', 1), 'viewer' => $request->user()->id],
            fn () => $this->listPayload($request, $validated),
        ));
    }

    private function listPayload(Request $request, array $validated): array
    {
        $query = Concern::query()->with('user:id,name')->latest();

        if (! $request->user()->isAdmin()) {
            $query->where('user_id', $request->user()->id);
        }

        $query
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($validated['category'] ?? null, fn ($q, $category) => $q->where('category', $category));

        return ConcernResource::collection(
            $query->paginate($validated['per_page'] ?? 10)->withQueryString()
        )->response($request)->getData(true);
    }

    public function show(Request $request, Concern $concern): ConcernResource
    {
        $this->authorize('view', $concern);

        return new ConcernResource($concern->load('user:id,name'));
    }

    public function store(StoreConcernRequest $request): JsonResponse
    {
        $attachment = $request->file('attachment');

        $concern = Concern::create([
            'user_id' => $request->user()->id,
            'title' => $request->string('title')->trim()->value(),
            'category' => $request->string('category')->value(),
            'description' => $request->string('description')->trim()->value(),
            'location' => $request->filled('location')
                ? $request->string('location')->trim()->value()
                : null,
            'attachment_path' => $attachment?->store('concerns', 'local'),
            'attachment_name' => $attachment?->getClientOriginalName(),
            'status' => Concern::STATUS_SUBMITTED,
        ]);

        DashboardController::forgetStudent($request->user()->id);
        DashboardController::forgetAdmin();
        ListCache::bump('concerns');

        return response()->json([
            'message' => 'Your concern has been submitted to the department.',
            'concern' => new ConcernResource($concern->load('user:id,name')),
        ], 201);
    }

    public function attachment(Request $request, Concern $concern): StreamedResponse
    {
        $this->authorize('view', $concern);

        abort_if(blank($concern->attachment_path), 404, 'This concern has no attachment.');
        abort_unless(Storage::disk('local')->exists($concern->attachment_path), 404, 'The attachment is no longer available.');

        return Storage::disk('local')->download($concern->attachment_path, $concern->attachment_name);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'categories' => Concern::CATEGORIES,
            'statuses' => Concern::STATUSES,
            'max_attachment_size_kb' => config('concerns.max_attachment_size_kb'),
            'allowed_extensions' => config('concerns.allowed_extensions'),
        ]);
    }
}
