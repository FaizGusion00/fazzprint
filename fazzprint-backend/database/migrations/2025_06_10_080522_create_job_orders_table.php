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
        Schema::create('job_orders', function (Blueprint $table) {
            $table->id('job_order_id'); // Primary key
            $table->unsignedBigInteger('customer_id'); // Foreign key to users table
            $table->unsignedBigInteger('started_by')->nullable(); // Foreign key to users table (sales manager)
            $table->enum('status', ['draft', 'started', 'in_progress', 'completed', 'cancelled'])->default('draft');
            $table->string('job_order_url')->unique(); // Unique URL for tracking
            $table->string('title'); // Job title
            $table->text('description'); // Job description
            $table->integer('quantity'); // Quantity to be printed
            $table->text('design_requirements')->nullable(); // Design requirements
            $table->text('special_instructions')->nullable(); // Special instructions
            $table->datetime('due_date')->nullable(); // Due date for completion
            $table->timestamps(); // created_at and updated_at

            // Foreign key constraints
            $table->foreign('customer_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('started_by')->references('user_id')->on('users')->onDelete('set null');

            // Indexes for better performance
            $table->index(['customer_id', 'status']);
            $table->index('job_order_url');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_orders');
    }
};
