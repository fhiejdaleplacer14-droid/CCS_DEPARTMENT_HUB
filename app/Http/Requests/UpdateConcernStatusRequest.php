<?php

namespace App\Http\Requests;

use App\Models\Concern;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateConcernStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(Concern::STATUSES)],
            'admin_response' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
