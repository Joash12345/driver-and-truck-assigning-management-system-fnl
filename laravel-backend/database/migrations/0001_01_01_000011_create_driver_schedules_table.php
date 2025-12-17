<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_schedules', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('driver_id');
            $table->string('truck_id')->nullable();
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->string('status')->default('planned');
            $table->text('route')->nullable();
            $table->text('notes')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_schedules');
    }
};
