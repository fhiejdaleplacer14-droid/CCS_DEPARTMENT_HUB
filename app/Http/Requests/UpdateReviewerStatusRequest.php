<?php

namespace App\Http\Requests;

use App\Models\Reviewer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReviewerStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in([
                Reviewer::STATUS_APPROVED,
                Reviewer::STATUS_REJECTED,
                Reviewer::STATUS_FLAGGED,
            ])],
        ];
    }
}
