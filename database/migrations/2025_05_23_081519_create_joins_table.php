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
        Schema::create('joins', function (Blueprint $table) {
            $table->uuid('id');
            $table->string('name', 256);
            $table->string('email', 256)->unique();
            $table->integer('age');
            $table->string('school', 256);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('joins');
    }
};
