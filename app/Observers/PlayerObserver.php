<?php

namespace App\Observers;

use App\Models\Player;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PlayerObserver
{
    public function updated(Player $player): void
    {
        try {
            if ($player->isDirty('image') && $player->getOriginal('image') != null) {
                Storage::disk('public')->delete($player->getOriginal('image'));
            }
        } catch (Exception $e) {
            Log::error("Failed to update image in player resource", [
                "player_id" => $player->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }

    public function deleted(Player $player): void
    {
        try {
            if ($player->image) {
                Storage::disk('public')->delete($player->image);
            }
        } catch (Exception $e) {
            Log::error("Failed to delete image in player resource", [
                "player_id" => $player->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }
}
