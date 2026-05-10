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
        Schema::create('abouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('first_description', 4096);
            $table->string('second_description', 4096);
            $table->string('parallax_images', 256)->nullable();
            $table->string('banner', 256)->nullable();
            $table->string('vision', 2048);
            $table->string('mission', 2048);
            $table->string('values', 2048);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('abouts');
    }
};
