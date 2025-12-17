<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('license_number')->unique();
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('status')->default('available');
            $table->string('license_type')->nullable();
            $table->date('license_expiry')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->text('address')->nullable();
            $table->string('assigned_vehicle')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
