<?php

return [

    'max_file_size_kb' => (int) env('REVIEWER_MAX_FILE_SIZE_KB', 10240), // 10 MB

    'allowed_extensions' => ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'],

    'allowed_mimes' => [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
    ],

    'subjects' => [
        'Programming Fundamentals',
        'Data Structures and Algorithms',
        'Database Systems',
        'Computer Networks',
        'Operating Systems',
        'Software Engineering',
        'Web Development',
        'Information Security',
        'Discrete Mathematics',
        'General Education',
        'Other',
    ],

    'year_levels' => ['1st Year', '2nd Year', '3rd Year', '4th Year'],

];
