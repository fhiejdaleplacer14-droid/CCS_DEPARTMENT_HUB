<?php

return [

    'max_attachment_size_kb' => (int) env('CONCERN_MAX_ATTACHMENT_SIZE_KB', 5120), // 5 MB

    'allowed_extensions' => ['pdf', 'jpg', 'jpeg', 'png', 'webp'],

    'allowed_mimes' => [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
    ],

];
