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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id('notification_id'); // Primary key
            $table->unsignedBigInteger('recipient_id'); // Foreign key to users table
            $table->unsignedBigInteger('job_order_id')->nullable(); // Foreign key to job_orders table
            $table->enum('type', ['order_created', 'order_started', 'order_in_progress', 'order_completed', 'process_started', 'process_completed', 'general']); // Notification type
            $table->string('title'); // Notification title
            $table->text('message'); // Notification message
            $table->boolean('is_read')->default(false); // Whether notification is read
            $table->boolean('email_sent')->default(false); // Whether email was sent
            $table->datetime('sent_at')->nullable(); // When notification was sent
            $table->timestamps(); // created_at and updated_at

            // Foreign key constraints
            $table->foreign('recipient_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('job_order_id')->references('job_order_id')->on('job_orders')->onDelete('cascade');

            // Indexes for better performance
            $table->index(['recipient_id', 'is_read']);
            $table->index(['job_order_id', 'type']);
            $table->index('type');
            $table->index('sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
