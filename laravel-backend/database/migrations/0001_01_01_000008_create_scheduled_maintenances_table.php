<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_maintenances', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('truck_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('scheduled_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->string('status')->default('scheduled');
            $table->string('performed_by')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->json('data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_maintenances');
    }
};
