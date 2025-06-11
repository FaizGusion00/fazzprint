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
        Schema::create('order_trackings', function (Blueprint $table) {
            $table->id('tracking_id'); // Primary key
            $table->unsignedBigInteger('job_order_id'); // Foreign key to job_orders table
            $table->unsignedBigInteger('admin_id')->nullable(); // Foreign key to users table (admin)
            $table->enum('status', ['received', 'design_review', 'production_queue', 'in_production', 'quality_check', 'packaging', 'ready_for_pickup', 'completed', 'cancelled']); // Order status
            $table->string('location')->default('Production Floor'); // Current location
            $table->text('description'); // Status description
            $table->integer('progress_percentage')->nullable(); // Progress percentage (0-100)
            $table->datetime('estimated_completion')->nullable(); // Estimated completion time
            $table->datetime('actual_completion')->nullable(); // Actual completion time
            $table->text('notes')->nullable(); // Additional notes
            $table->timestamps(); // created_at and updated_at

            // Foreign key constraints
            $table->foreign('job_order_id')->references('job_order_id')->on('job_orders')->onDelete('cascade');
            $table->foreign('admin_id')->references('user_id')->on('users')->onDelete('set null');

            // Indexes for better performance
            $table->index(['job_order_id', 'status']);
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_trackings');
    }
};
