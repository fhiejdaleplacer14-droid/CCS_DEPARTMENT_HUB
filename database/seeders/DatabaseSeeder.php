<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@departmenthub.test'],
            [
                'name' => 'Department Administrator',
                'password' => 'password',
                'role' => User::ROLE_ADMIN,
            ]
        );

        User::updateOrCreate(
            ['email' => 'student@departmenthub.test'],
            [
                'name' => 'Sample Student',
                'password' => 'password',
                'role' => User::ROLE_STUDENT,
            ]
        );

        $announcements = [
            [
                'title' => 'Midterm Examination Schedule Released',
                'content' => "The midterm examination schedule for all year levels is now posted on the department board.\n\nPlease check your assigned room and time carefully. Bring your student ID to every examination.",
            ],
            [
                'title' => 'Computer Laboratory 2 Maintenance',
                'content' => "Computer Laboratory 2 will be closed for scheduled maintenance this weekend.\n\nClasses assigned to the laboratory will be moved to Laboratory 3. Watch for a notice from your instructor.",
            ],
            [
                'title' => 'Reviewer Uploads Are Now AI-Screened',
                'content' => "Uploads to the reviewer library are now screened automatically before they are published.\n\nMost reviewers appear within seconds. Anything the screening cannot decide on is passed to an administrator for a quick manual check.",
            ],
        ];

        foreach ($announcements as $announcement) {
            Announcement::updateOrCreate(
                ['title' => $announcement['title']],
                $announcement + ['created_by' => $admin->id]
            );
        }
    }
}
