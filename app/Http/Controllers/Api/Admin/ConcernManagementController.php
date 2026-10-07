<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateConcernStatusRequest;
use App\Http\Resources\ConcernResource;
use App\Models\Concern;
use App\Support\ListCache;
use Illuminate\Http\JsonResponse;

class ConcernManagementController extends Controller
{
    public function update(UpdateConcernStatusRequest $request, Concern $concern): JsonResponse
    {
        $this->authorize('update', $concern);

        $status = $request->string('status')->value();

        $concern->update([
            'status' => $status,
            'admin_response' => $request->filled('admin_response')
                ? $request->string('admin_response')->trim()->value()
                : $concern->admin_response,
            'resolved_at' => in_array($status, [Concern::STATUS_RESOLVED, Concern::STATUS_CLOSED], true)
                ? ($concern->resolved_at ?? now())
                : null,
        ]);

        ListCache::bump('concerns');
        \App\Http\Controllers\Api\DashboardController::forgetStudent($concern->user_id);
        \App\Http\Controllers\Api\DashboardController::forgetAdmin();

        return response()->json([
            'message' => 'Concern updated.',
            'concern' => new ConcernResource($concern->load('user:id,name')),
        ]);
    }

    public function destroy(Concern $concern): JsonResponse
    {
        $this->authorize('delete', $concern);

        $userId = $concern->user_id;
        $concern->delete();

        ListCache::bump('concerns');
        \App\Http\Controllers\Api\DashboardController::forgetStudent($userId);
        \App\Http\Controllers\Api\DashboardController::forgetAdmin();

        return response()->json(['message' => 'Concern deleted.']);
    }
}
