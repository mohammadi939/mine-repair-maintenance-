<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('failure_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reported_by')->constrained('users')->cascadeOnDelete();
            $table->string('failure_code');
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('low');
            $table->text('description');
            $table->timestamp('reported_at')->nullable();
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->json('attachments')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('failure_reports');
    }
};
