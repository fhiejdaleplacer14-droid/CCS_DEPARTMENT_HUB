<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnnouncementRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:4', 'max:150'],
            'content' => ['required', 'string', 'min:10', 'max:5000'],
        ];
    }
}
