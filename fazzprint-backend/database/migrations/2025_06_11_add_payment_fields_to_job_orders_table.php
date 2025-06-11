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
        Schema::table('job_orders', function (Blueprint $table) {
            // Payment and pricing fields
            $table->decimal('estimated_price', 10, 2)->nullable()->after('due_date'); // Estimated price from system
            $table->decimal('quoted_price', 10, 2)->nullable()->after('estimated_price'); // Price quoted by sales manager
            $table->decimal('final_price', 10, 2)->nullable()->after('quoted_price'); // Final agreed price
            $table->enum('payment_status', ['pending', 'partial', 'paid', 'refunded'])->default('pending')->after('final_price'); // Payment status
            $table->decimal('amount_paid', 10, 2)->default(0.00)->after('payment_status'); // Amount paid so far
            $table->decimal('balance_due', 10, 2)->nullable()->after('amount_paid'); // Remaining balance
            $table->text('payment_notes')->nullable()->after('balance_due'); // Payment notes/instructions
            $table->datetime('payment_due_date')->nullable()->after('payment_notes'); // Payment due date
            $table->datetime('payment_confirmed_at')->nullable()->after('payment_due_date'); // When payment was confirmed
            $table->unsignedBigInteger('payment_confirmed_by')->nullable()->after('payment_confirmed_at'); // Who confirmed payment
            
            // Foreign key for payment confirmed by
            $table->foreign('payment_confirmed_by')->references('user_id')->on('users')->onDelete('set null');
            
            // Indexes for payment queries
            $table->index('payment_status');
            $table->index('payment_due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->dropForeign(['payment_confirmed_by']);
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['payment_due_date']);
            $table->dropColumn([
                'estimated_price',
                'quoted_price', 
                'final_price',
                'payment_status',
                'amount_paid',
                'balance_due',
                'payment_notes',
                'payment_due_date',
                'payment_confirmed_at',
                'payment_confirmed_by'
            ]);
        });
    }
}; 