<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('processes', function (Blueprint $table) {
            $table->id('process_id'); // Primary key
            $table->unsignedBigInteger('process_step_id'); // Foreign key to process_steps table
            $table->unsignedBigInteger('pic_id')->nullable(); // Person in charge (staff user_id)
            $table->enum('status', ['pending', 'in_progress', 'completed', 'paused', 'cancelled'])->default('pending');
            $table->datetime('start_time')->nullable(); // When the process was started
            $table->datetime('end_time')->nullable(); // When the process was completed
            $table->integer('start_quantity')->nullable(); // Initial quantity when starting
            $table->integer('end_quantity')->nullable(); // Final quantity when completed
            $table->integer('reject_quantity')->default(0); // Number of rejected items
            $table->text('remark')->nullable(); // Additional remarks or notes
            $table->string('staff_name')->nullable(); // Staff name for backup reference
            $table->timestamps(); // created_at and updated_at

            // Foreign key constraints
            $table->foreign('process_step_id')->references('process_step_id')->on('process_steps')->onDelete('cascade');
            $table->foreign('pic_id')->references('user_id')->on('users')->onDelete('set null');

            // Indexes for better performance
            $table->index(['process_step_id', 'status']);
            $table->index(['pic_id', 'status']);
            $table->index('status');
            $table->index('start_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('processes');
    }
};
