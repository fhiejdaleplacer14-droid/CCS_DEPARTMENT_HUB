<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isAdmin = (bool) $user?->isAdmin();
        $isOwner = $user !== null && $user->id === $this->uploaded_by;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'subject' => $this->subject,
            'year_level' => $this->year_level,
            'status' => $this->status,
            'topics' => $this->ai_topics ?? [],
            'file_name' => $this->file_name,
            'file_size' => $this->file_size,
            'download_count' => $this->download_count,
            'uploader' => [
                'id' => $this->uploaded_by,
                'name' => $this->whenLoaded('uploader', fn () => $this->uploader?->name),
            ],
            'created_at' => $this->created_at?->toIso8601String(),

            'ai' => $this->when($isAdmin || $isOwner, fn () => [
                'decision' => $this->ai_decision,
                'confidence' => $this->ai_confidence,
                'subject' => $this->ai_subject,
                'year_level' => $this->ai_year_level,
                'quality' => $this->ai_quality,
                'reason' => $this->ai_reason,
                'analyzed_at' => $this->ai_analyzed_at?->toIso8601String(),
            ]),

            'reviewed_by' => $this->when($isAdmin, fn () => $this->whenLoaded('reviewer', fn () => $this->reviewer?->name)),
            'reviewed_at' => $this->when($isAdmin, fn () => $this->reviewed_at?->toIso8601String()),
        ];
    }
}
