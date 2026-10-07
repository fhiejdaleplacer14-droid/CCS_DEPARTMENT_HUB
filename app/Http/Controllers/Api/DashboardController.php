<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Http\Resources\ConcernResource;
use App\Http\Resources\ReviewerResource;
use App\Models\Announcement;
use App\Models\Concern;
use App\Models\Reviewer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private const CACHE_SECONDS = 30;

    public static function forgetStudent(int $userId): void
    {
        Cache::forget("dashboard.student.{$userId}");
    }

    public static function forgetAdmin(): void
    {
        Cache::forget('dashboard.admin');
    }

    public function student(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json(
            Cache::remember(
                "dashboard.student.{$user->id}",
                self::CACHE_SECONDS,
                fn () => $this->studentPayload($user)
            )
        );
    }

    public function admin(Request $request): JsonResponse
    {
        return response()->json(
            Cache::remember('dashboard.admin', self::CACHE_SECONDS, fn () => $this->adminPayload($request))
        );
    }

    private function studentPayload(User $user): array
    {
        $recentConcerns = Concern::where('user_id', $user->id)->latest()->take(4)->get();

        $recentConcerns->each->setRelation('user', $user);

        return [
            'stats' => $this->studentStats($user),
            'recent_reviewers' => ReviewerResource::collection(
                Reviewer::approved()->with('uploader:id,name')->latest()->take(4)->get()
            ),
            'recent_announcements' => AnnouncementResource::collection(
                Announcement::with('author:id,name')->latest()->take(3)->get()
            ),
            'my_concerns' => ConcernResource::collection($recentConcerns),
        ];
    }

    private function adminPayload(Request $request): array
    {
        return [
            'stats' => $this->adminStats(),
            'recent_reviewers' => ReviewerResource::collection(
                Reviewer::with('uploader:id,name')->latest()->take(5)->get()
            ),
            'recent_concerns' => ConcernResource::collection(
                Concern::with('user:id,name')->latest()->take(5)->get()
            ),
            'recent_announcements' => AnnouncementResource::collection(
                Announcement::with('author:id,name')->latest()->take(3)->get()
            ),
        ];
    }

    /** All four figures in one round trip rather than four. */
    private function studentStats(User $user): array
    {
        $row = DB::query()->selectSub(
            Reviewer::approved()->selectRaw('count(*)'), 'available_reviewers'
        )->selectSub(
            Reviewer::where('uploaded_by', $user->id)->selectRaw('count(*)'), 'my_uploads'
        )->selectSub(
            Concern::where('user_id', $user->id)->selectRaw('count(*)'), 'my_concerns'
        )->selectSub(
            Announcement::query()->selectRaw('count(*)'), 'announcements'
        )->first();

        return [
            'available_reviewers' => (int) $row->available_reviewers,
            'my_uploads' => (int) $row->my_uploads,
            'my_concerns' => (int) $row->my_concerns,
            'announcements' => (int) $row->announcements,
        ];
    }

    private function adminStats(): array
    {
        $row = DB::query()->selectSub(
            User::where('role', User::ROLE_STUDENT)->selectRaw('count(*)'), 'total_students'
        )->selectSub(
            Reviewer::approved()->selectRaw('count(*)'), 'total_reviewers'
        )->selectSub(
            Reviewer::whereIn('status', [Reviewer::STATUS_FLAGGED, Reviewer::STATUS_PENDING])->selectRaw('count(*)'),
            'needs_review'
        )->selectSub(
            Concern::whereIn('status', Concern::OPEN_STATUSES)->selectRaw('count(*)'), 'open_concerns'
        )->first();

        return [
            'total_students' => (int) $row->total_students,
            'total_reviewers' => (int) $row->total_reviewers,
            'needs_review' => (int) $row->needs_review,
            'open_concerns' => (int) $row->open_concerns,
        ];
    }
}
