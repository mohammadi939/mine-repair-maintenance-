<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exit_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('form_number')->unique();
            $table->enum('request_type', ['repair', 'inspection', 'external']);
            $table->text('reason');
            $table->timestamp('expected_return_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('pending');
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exit_requests');
    }
};
