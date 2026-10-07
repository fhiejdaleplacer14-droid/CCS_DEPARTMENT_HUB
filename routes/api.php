<?php

use App\Http\Controllers\Api\Admin\ConcernManagementController;
use App\Http\Controllers\Api\Admin\ReviewerModerationController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConcernController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReviewerController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('/reviewers/filters', [ReviewerController::class, 'filters']);
Route::get('/announcements', [AnnouncementController::class, 'index']);
Route::get('/announcements/{announcement}', [AnnouncementController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard', [DashboardController::class, 'student']);

    Route::get('/reviewers', [ReviewerController::class, 'index']);
    Route::post('/reviewers', [ReviewerController::class, 'store'])->middleware('throttle:20,1');
    Route::get('/reviewers/{reviewer}', [ReviewerController::class, 'show']);
    Route::get('/reviewers/{reviewer}/download', [ReviewerController::class, 'download']);
    Route::delete('/reviewers/{reviewer}', [ReviewerController::class, 'destroy']);

    Route::get('/concerns/categories', [ConcernController::class, 'categories']);
    Route::get('/concerns', [ConcernController::class, 'index']);
    Route::post('/concerns', [ConcernController::class, 'store'])->middleware('throttle:20,1');
    Route::get('/concerns/{concern}', [ConcernController::class, 'show']);
    Route::get('/concerns/{concern}/attachment', [ConcernController::class, 'attachment']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'admin']);
        Route::get('/users', [UserController::class, 'index']);

        Route::get('/reviewers', [ReviewerModerationController::class, 'index']);
        Route::get('/reviewers/flagged', [ReviewerModerationController::class, 'flagged']);
        Route::put('/reviewers/{reviewer}/status', [ReviewerModerationController::class, 'updateStatus']);
        Route::post('/reviewers/{reviewer}/rescreen', [ReviewerModerationController::class, 'rescreen']);

        Route::get('/concerns', [ConcernController::class, 'index']);
        Route::put('/concerns/{concern}', [ConcernManagementController::class, 'update']);
        Route::delete('/concerns/{concern}', [ConcernManagementController::class, 'destroy']);

        Route::post('/announcements', [AnnouncementController::class, 'store']);
        Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
        Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);
    });
});
