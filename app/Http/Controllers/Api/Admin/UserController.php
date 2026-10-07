<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:150'],
            'role' => ['nullable', 'in:student,admin'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $users = User::query()
            ->withCount(['reviewers', 'concerns'])
            ->when($validated['search'] ?? null, function ($query, string $term) {
                $like = '%'.$term.'%';
                $query->where(fn ($q) => $q->where('name', 'like', $like)->orWhere('email', 'like', $like));
            })
            ->when($validated['role'] ?? null, fn ($q, $role) => $q->where('role', $role))
            ->latest()
            ->paginate($validated['per_page'] ?? 15)
            ->withQueryString();

        return UserResource::collection($users)->additional([
            'meta_counts' => [
                'students' => User::where('role', User::ROLE_STUDENT)->count(),
                'admins' => User::where('role', User::ROLE_ADMIN)->count(),
            ],
        ]);
    }
}
