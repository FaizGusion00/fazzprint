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
        Schema::create('q_r_codes', function (Blueprint $table) {
            $table->id('qr_code_id');
            $table->unsignedBigInteger('job_order_id');
            $table->text('qr_code_data');
            $table->string('qr_code_image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('job_order_id')->references('job_order_id')->on('job_orders')->onDelete('cascade');

            $table->index('job_order_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('q_r_codes');
    }
};
