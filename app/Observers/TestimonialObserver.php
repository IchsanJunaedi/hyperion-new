<?php

namespace App\Observers;

use App\Models\Testimonial;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TestimonialObserver
{
    public function updated(Testimonial $testimonial): void
    {
        try {
            if ($testimonial->isDirty('image') && $testimonial->getOriginal('image') != null) {
                Storage::disk('public')->delete($testimonial->getOriginal('image'));
            }
        } catch (Exception $e) {
            Log::error("Failed to update image in testimonial resource", [
                "testimonial_id" => $testimonial->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }

    public function deleted(Testimonial $testimonial): void
    {
        try {
            if ($testimonial->image) {
                Storage::disk('public')->delete($testimonial->image);
            }
        } catch (Exception $e) {
            Log::error("Failed to delete image in testimonial resource", [
                "testimonial_id" => $testimonial->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }
}
