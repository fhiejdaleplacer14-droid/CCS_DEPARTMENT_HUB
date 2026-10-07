# CCS Department Hub

A centralized academic resource and student concern management system for a college
Computer Studies department.

Students browse and share academic reviewers, submit department concerns and follow
them through to resolution, and read department announcements. Uploaded reviewers are
screened by Google Gemini so administrators only review the uploads the AI could not
decide on by itself.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router |
| Backend | Laravel 12 (REST API), PHP 8.2 |
| Database | MySQL / MariaDB |
| Auth | Laravel Sanctum (bearer tokens) |
| AI | Google Gemini |