<?php

namespace App\Policies;

use App\Models\Reviewer;
use App\Models\User;

class ReviewerPolicy
{

    public function view(User $user, Reviewer $reviewer): bool
    {
        return $user->isAdmin()
            || $reviewer->status === Reviewer::STATUS_APPROVED
            || $reviewer->uploaded_by === $user->id;
    }

    public function download(User $user, Reviewer $reviewer): bool
    {
        return $user->isAdmin() || $reviewer->isDownloadable();
    }

    public function delete(User $user, Reviewer $reviewer): bool
    {
        return $user->isAdmin() || $reviewer->uploaded_by === $user->id;
    }

    public function moderate(User $user): bool
    {
        return $user->isAdmin();
    }
}
