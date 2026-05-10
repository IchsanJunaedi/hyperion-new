<?php

namespace App\Observers;

use App\Models\About;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AboutObserver
{
    public function updated(About $about): void
    {
        try {
            if ($about->getOriginal('parallax_images') != null) {
                if ($about->isDirty('parallax_images')) {

                    $originalFieldContents = $about->getOriginal('parallax_images');
                    $newFieldContents = $about->parallax_images;

                    # We attempt to JSON decode the field. If it is an array, this is an indication we have ->multiple() activated
                    if (is_array($originalFieldContents)) {
                        $originalFieldContentsDecoded = $originalFieldContents;
                    } else {
                        $originalFieldContentsDecoded = json_decode($originalFieldContents);
                    }

                    # Clean up empty entries in the resulting array
                    if (is_array($originalFieldContentsDecoded)) $originalFieldContentsDecoded = array_filter($originalFieldContentsDecoded);

                    # Simple case: one file
                    if (!is_array($originalFieldContentsDecoded) or count($originalFieldContentsDecoded) == 0) {
                        Storage::disk('public')->delete($originalFieldContents);
                    }

                    # Complex case: multiple files
                    else {
                        foreach ($originalFieldContentsDecoded as $originalFile) {
                            if (trim($originalFile) != null && !in_array($originalFile, $newFieldContents)) {
                                Storage::disk('public')->delete($originalFile);
                            }
                        }
                    }
                }
            };

            if ($about->isDirty('banner') && $about->getOriginal('banner') != null) {
                Storage::disk('public')->delete($about->getOriginal('banner'));
            }
        } catch (Exception $e) {
            Log::error("Failed to update images in about resource", [
                "about_id" => $about->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }

    public function deleted(About $about): void
    {
        try {
            if (! is_null($about->parallax_images)) {

                # We attempt to JSON decode the field. If it is an array, there are multiple files
                $fieldContentsDecoded = $about->parallax_images;

                # Simple case: one file
                if (!is_array($fieldContentsDecoded)) {
                    Storage::disk('public')->delete($about->parallax_images);
                }

                # Complex case: multiple files
                else {

                    foreach ($fieldContentsDecoded as $file) {
                        Storage::disk('public')->delete($file);
                    }
                }
            }

            if ($about->banner) {
                Storage::disk('public')->delete($about->banner);
            }
        } catch (Exception $e) {
            Log::error("Failed to delete images in about resource", [
                "about_id" => $about->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }
}
