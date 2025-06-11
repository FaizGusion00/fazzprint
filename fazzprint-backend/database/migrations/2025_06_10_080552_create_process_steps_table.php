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
        Schema::create('process_steps', function (Blueprint $table) {
            $table->id('process_step_id');
            $table->unsignedBigInteger('job_order_id');
            $table->string('step_name');
            $table->text('step_description')->nullable();
            $table->integer('step_order');
            $table->integer('estimated_duration')->nullable();
            $table->boolean('is_required')->default(true);
            $table->timestamps();

            $table->foreign('job_order_id')->references('job_order_id')->on('job_orders')->onDelete('cascade');

            $table->index(['job_order_id', 'step_order']);
            $table->index('step_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('process_steps');
    }
};
