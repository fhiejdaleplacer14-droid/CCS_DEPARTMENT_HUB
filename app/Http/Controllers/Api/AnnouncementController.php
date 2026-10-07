<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use App\Support\ListCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->integer('per_page', 10), 1), 50);
        $page = $request->integer('page', 1);

        return response()->json(ListCache::remember(
            'announcements',
            ['per_page' => $perPage, 'page' => $page],
            fn () => AnnouncementResource::collection(
                Announcement::query()->with('author:id,name')->latest()->paginate($perPage)
            )->response($request)->getData(true),
        ));
    }

    public function show(Announcement $announcement): AnnouncementResource
    {
        return new AnnouncementResource($announcement->load('author:id,name'));
    }

    public function store(StoreAnnouncementRequest $request): JsonResponse
    {
        $this->authorize('create', Announcement::class);

        $announcement = Announcement::create([
            'title' => $request->string('title')->trim()->value(),
            'content' => $request->string('content')->trim()->value(),
            'created_by' => $request->user()->id,
        ]);

        DashboardController::forgetAdmin();
        ListCache::bump('announcements');

        return response()->json([
            'message' => 'Announcement published.',
            'announcement' => new AnnouncementResource($announcement->load('author:id,name')),
        ], 201);
    }

    public function update(StoreAnnouncementRequest $request, Announcement $announcement): JsonResponse
    {
        $this->authorize('update', $announcement);

        $announcement->update([
            'title' => $request->string('title')->trim()->value(),
            'content' => $request->string('content')->trim()->value(),
        ]);

        DashboardController::forgetAdmin();
        ListCache::bump('announcements');

        return response()->json([
            'message' => 'Announcement updated.',
            'announcement' => new AnnouncementResource($announcement->load('author:id,name')),
        ]);
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $this->authorize('delete', $announcement);

        $announcement->delete();

        DashboardController::forgetAdmin();
        ListCache::bump('announcements');

        return response()->json(['message' => 'Announcement deleted.']);
    }
}
