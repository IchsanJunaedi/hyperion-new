<?php

namespace App\Observers;

use App\Models\Division;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DivisionObserver
{
    public function updated(Division $division): void
    {
        try {
            if ($division->isDirty('banner_image') && $division->getOriginal('banner_image') != null) {
                Storage::disk('public')->delete($division->getOriginal('banner_image'));
            }
        } catch (Exception $e) {
            Log::error("Failed to update banner image in division resource", [
                "division_id" => $division->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }

    public function deleted(Division $division): void
    {
        try {
            if ($division->banner_image) {
                Storage::disk('public')->delete($division->banner_image);
            }
        } catch (Exception $e) {
            Log::error("Failed to delete banner image in division resource", [
                "division_id" => $division->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }
}
