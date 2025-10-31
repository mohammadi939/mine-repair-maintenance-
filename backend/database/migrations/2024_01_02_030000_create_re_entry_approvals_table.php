<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_entry_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('approved_by')->constrained('users')->cascadeOnDelete();
            $table->string('form_number')->unique();
            $table->text('inspection_notes');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->json('safety_checks')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_entry_approvals');
    }
};
