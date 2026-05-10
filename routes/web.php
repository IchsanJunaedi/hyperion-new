<?php

use App\Http\Controllers\DivisionController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\JoinController;
use Illuminate\Support\Facades\Route;

// Home Controller
Route::get('/', [\App\Http\Controllers\HomeController::class, 'index'])->name('home');

// About Controller
Route::get('/about', [\App\Http\Controllers\AboutController::class, 'index'])->name('about');

// Gallery Controller
Route::prefix('/gallery')->controller(GalleryController::class)->group(function () {
    Route::get('', 'index')->name('gallery.index');
    Route::get('{slug}', 'show')->name('gallery.show');
});

// Division Controller
Route::prefix('/divisions')->controller(DivisionController::class)->group(function () {
    Route::get('{title}/{slug}', 'show')->name('division.show');
    Route::get('{title}', 'index')->name('division.index');
});

Route::post('/join', [JoinController::class, 'store']);
