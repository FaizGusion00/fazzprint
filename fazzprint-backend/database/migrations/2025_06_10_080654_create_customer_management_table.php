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
        Schema::create('customer_management', function (Blueprint $table) {
            $table->id('customer_management_id'); // Primary key
            $table->unsignedBigInteger('customer_id'); // Foreign key to users table
            $table->unsignedBigInteger('admin_id')->nullable(); // Foreign key to users table (admin)
            $table->integer('total_orders')->default(0); // Total number of orders
            $table->decimal('total_spent', 10, 2)->default(0.00); // Total amount spent
            $table->datetime('last_order_date')->nullable(); // Last order date
            $table->enum('customer_status', ['active', 'inactive', 'vip', 'blocked'])->default('active'); // Customer status
            $table->text('notes')->nullable(); // Admin notes about customer
            $table->enum('preferred_contact_method', ['email', 'phone', 'sms'])->default('email'); // Preferred contact method
            $table->timestamps(); // created_at and updated_at

            // Foreign key constraints
            $table->foreign('customer_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('admin_id')->references('user_id')->on('users')->onDelete('set null');

            // Indexes for better performance
            $table->index(['customer_id', 'customer_status']);
            $table->index('customer_status');
            $table->index('last_order_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_management');
    }
};
