<?php

namespace App\Observers;

use App\Models\Partner;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PartnerObserver
{
    public function updated(Partner $partner): void
    {
        try {
            if ($partner->isDirty('image') && $partner->getOriginal('image') != null) {
                Storage::disk('public')->delete($partner->getOriginal('image'));
            }
        } catch (Exception $e) {
            Log::error("Failed to update image in partner resource", [
                "partner_id" => $partner->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }

    public function deleted(Partner $partner): void
    {
        try {
            if ($partner->image) {
                Storage::disk('public')->delete($partner->image);
            }
        } catch (Exception $e) {
            Log::error("Failed to delete image in partner resource", [
                "partner_id" => $partner->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }
}
