<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reviewer extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'PENDING';
    public const STATUS_APPROVED = 'APPROVED';
    public const STATUS_FLAGGED = 'FLAGGED';
    public const STATUS_REJECTED = 'REJECTED';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_APPROVED,
        self::STATUS_FLAGGED,
        self::STATUS_REJECTED,
    ];

    /** Mirrors the column defaults so a freshly created model serialises correctly. */
    protected $attributes = [
        'status' => self::STATUS_PENDING,
        'download_count' => 0,
    ];

    protected $fillable = [
        'title',
        'description',
        'subject',
        'year_level',
        'file_path',
        'file_name',
        'file_mime',
        'file_size',
        'uploaded_by',
        'status',
        'ai_decision',
        'ai_confidence',
        'ai_subject',
        'ai_year_level',
        'ai_topics',
        'ai_quality',
        'ai_reason',
        'ai_analyzed_at',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'ai_topics' => 'array',
            'ai_confidence' => 'float',
            'ai_analyzed_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'file_size' => 'integer',
            'download_count' => 'integer',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $like = '%'.$term.'%';
            $q->where('title', 'like', $like)
                ->orWhere('description', 'like', $like)
                ->orWhere('subject', 'like', $like);
        });
    }

    public function isDownloadable(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }
}
