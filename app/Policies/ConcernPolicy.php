<?php

namespace App\Policies;

use App\Models\Concern;
use App\Models\User;

class ConcernPolicy
{
    public function view(User $user, Concern $concern): bool
    {
        return $user->isAdmin() || $concern->user_id === $user->id;
    }

    public function update(User $user, Concern $concern): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Concern $concern): bool
    {
        return $user->isAdmin() || $concern->user_id === $user->id;
    }
}
