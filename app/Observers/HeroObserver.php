<?php

namespace App\Observers;

use App\Models\Hero;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class HeroObserver
{
    public function updated(Hero $hero): void
    {
        try {
            if ($hero->isDirty('logo') && $hero->getOriginal('logo') != null) {
                Storage::disk('public')->delete($hero->getOriginal('logo'));
            }
        } catch (Exception $e) {
            Log::error("Failed to update logo in hero resource", [
                "hero_id" => $hero->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }

    public function deleted(hero $hero): void
    {
        try {
            if ($hero->logo) {
                Storage::disk('public')->delete($hero->logo);
            }
        } catch (Exception $e) {
            Log::error("Failed to delete logo in hero resource", [
                "hero_id" => $hero->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }
}
