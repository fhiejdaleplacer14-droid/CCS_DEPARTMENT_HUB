<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('concerns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('category', 60)->index();
            $table->text('description');
            $table->string('location')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();

            // SUBMITTED | UNDER REVIEW | IN PROGRESS | RESOLVED | CLOSED
            $table->string('status', 20)->default('SUBMITTED')->index();
            $table->text('admin_response')->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('concerns');
    }
};
