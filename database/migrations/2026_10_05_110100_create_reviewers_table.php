<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviewers', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('subject')->index();
            $table->string('year_level', 50)->index();

            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_mime', 120)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->unsignedInteger('download_count')->default(0);

            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();

            // PENDING | APPROVED | FLAGGED | REJECTED
            $table->string('status', 20)->default('PENDING')->index();

            // Gemini analysis snapshot. Nullable: the AI layer may be unavailable.
            $table->string('ai_decision', 20)->nullable();
            $table->decimal('ai_confidence', 4, 3)->nullable();
            $table->string('ai_subject')->nullable();
            $table->string('ai_year_level', 50)->nullable();
            $table->json('ai_topics')->nullable();
            $table->string('ai_quality', 20)->nullable();
            $table->text('ai_reason')->nullable();
            $table->timestamp('ai_analyzed_at')->nullable();

            // Set when an administrator overrides the AI recommendation.
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviewers');
    }
};
