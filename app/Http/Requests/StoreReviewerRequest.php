<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReviewerRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:4', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'subject' => ['required', 'string', Rule::in(config('reviewers.subjects'))],
            'year_level' => ['required', 'string', Rule::in(config('reviewers.year_levels'))],
            'file' => [
                'required',
                'file',
                'max:'.config('reviewers.max_file_size_kb'),
                'extensions:'.implode(',', config('reviewers.allowed_extensions')),
                'mimes:'.implode(',', config('reviewers.allowed_extensions')),
                'mimetypes:'.implode(',', config('reviewers.allowed_mimes')),
            ],
        ];
    }

    public function messages(): array
    {
        $maxMb = round(config('reviewers.max_file_size_kb') / 1024, 1);

        return [
            'file.max' => "The file may not be larger than {$maxMb} MB.",
            'file.extensions' => 'Upload a PDF, Word, PowerPoint or text document.',
            'file.mimes' => 'Upload a PDF, Word, PowerPoint or text document.',
            'file.mimetypes' => 'The file contents do not match an accepted document type.',
            'subject.in' => 'Choose a subject from the list.',
            'year_level.in' => 'Choose a year level from the list.',
        ];
    }
}
