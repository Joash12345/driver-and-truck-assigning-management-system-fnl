<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('user_id')->nullable();
            $table->string('type')->nullable();
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->dateTime('read_at')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
