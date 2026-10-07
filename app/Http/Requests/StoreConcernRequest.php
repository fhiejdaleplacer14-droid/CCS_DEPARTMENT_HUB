<?php

namespace App\Http\Requests;

use App\Models\Concern;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreConcernRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:4', 'max:150'],
            'category' => ['required', 'string', Rule::in(Concern::CATEGORIES)],
            'description' => ['required', 'string', 'min:10', 'max:4000'],
            'location' => ['nullable', 'string', 'max:150'],
            'attachment' => [
                'nullable',
                'file',
                'max:'.config('concerns.max_attachment_size_kb'),
                'extensions:'.implode(',', config('concerns.allowed_extensions')),
                'mimes:'.implode(',', config('concerns.allowed_extensions')),
                'mimetypes:'.implode(',', config('concerns.allowed_mimes')),
            ],
        ];
    }

    public function messages(): array
    {
        $maxMb = round(config('concerns.max_attachment_size_kb') / 1024, 1);

        return [
            'attachment.max' => "The attachment may not be larger than {$maxMb} MB.",
            'attachment.extensions' => 'Attach a PDF or an image file.',
            'attachment.mimes' => 'Attach a PDF or an image file.',
            'attachment.mimetypes' => 'The attachment contents do not match an accepted file type.',
            'category.in' => 'Choose a category from the list.',
        ];
    }
}
