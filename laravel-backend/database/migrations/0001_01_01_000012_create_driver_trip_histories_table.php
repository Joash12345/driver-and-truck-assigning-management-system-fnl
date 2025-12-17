<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_trip_histories', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('trip_id')->nullable();
            $table->string('driver_id')->nullable();
            $table->string('truck_id')->nullable();
            $table->text('origin')->nullable();
            $table->text('destination')->nullable();
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->decimal('travel_time_seconds', 10, 0)->nullable();
            $table->decimal('origin_lat', 10, 6)->nullable();
            $table->decimal('origin_lng', 10, 6)->nullable();
            $table->decimal('dest_lat', 10, 6)->nullable();
            $table->decimal('dest_lng', 10, 6)->nullable();
            $table->string('status')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('archived_at')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_trip_histories');
    }
};
