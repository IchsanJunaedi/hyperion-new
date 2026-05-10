<?php

namespace App\Observers;

use App\Models\Team;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TeamObserver
{
    public function updated(Team $team): void
    {
        try {
            if ($team->isDirty('image') && $team->getOriginal('image') != null) {
                Storage::disk('public')->delete($team->getOriginal('image'));
            }
        } catch (Exception $e) {
            Log::error("Failed to update image in team resource", [
                "team_id" => $team->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }

    public function deleted(Team $team): void
    {
        try {
            if ($team->image) {
                Storage::disk('public')->delete($team->image);
            }
        } catch (Exception $e) {
            Log::error("Failed to delete image in team resource", [
                "team_id" => $team->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }
}
