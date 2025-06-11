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
        Schema::create('order_files', function (Blueprint $table) {
            $table->id('file_id');
            $table->unsignedBigInteger('job_order_id');
            $table->unsignedBigInteger('uploaded_by');
            $table->string('file_name');
            $table->string('file_path');
            $table->bigInteger('file_size');
            $table->string('file_type', 10);
            $table->string('mime_type');
            $table->text('description')->nullable();
            $table->boolean('is_design_file')->default(false);
            $table->timestamps();

            $table->foreign('job_order_id')->references('job_order_id')->on('job_orders')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('user_id')->on('users')->onDelete('cascade');

            $table->index(['job_order_id', 'is_design_file']);
            $table->index('uploaded_by');
            $table->index('file_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_files');
    }
};
