<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Concern extends Model
{
    use HasFactory;

    public const STATUS_SUBMITTED = 'SUBMITTED';
    public const STATUS_UNDER_REVIEW = 'UNDER REVIEW';
    public const STATUS_IN_PROGRESS = 'IN PROGRESS';
    public const STATUS_RESOLVED = 'RESOLVED';
    public const STATUS_CLOSED = 'CLOSED';

    public const STATUSES = [
        self::STATUS_SUBMITTED,
        self::STATUS_UNDER_REVIEW,
        self::STATUS_IN_PROGRESS,
        self::STATUS_RESOLVED,
        self::STATUS_CLOSED,
    ];

    public const OPEN_STATUSES = [
        self::STATUS_SUBMITTED,
        self::STATUS_UNDER_REVIEW,
        self::STATUS_IN_PROGRESS,
    ];

    public const CATEGORIES = [
        'Classroom',
        'Laboratory',
        'Internet',
        'Facilities',
        'Schedule',
        'Department Services',
        'Academic',
        'Other',
    ];

    protected $fillable = [
        'user_id',
        'title',
        'category',
        'description',
        'location',
        'attachment_path',
        'attachment_name',
        'status',
        'admin_response',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
