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
        Schema::create('trucks', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('plate_number')->unique();
            $table->string('model');
            $table->string('driver')->nullable();
            $table->integer('fuel_level')->default(100);
            $table->decimal('load_capacity', 5, 2)->default(0);
            $table->string('fuel_type')->default('Diesel');
            $table->string('status')->default('available');
            $table->date('last_maintenance')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trucks');
    }
};
