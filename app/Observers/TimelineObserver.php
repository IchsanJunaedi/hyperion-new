<?php

namespace App\Observers;

use App\Models\Timeline;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TimelineObserver
{
    /**
     * Handle the Timeline "updated" event.
     */
    public function updated(Timeline $timeline): void
    {
        if ($timeline->getOriginal('images') != null) {
            try {
                if ($timeline->isDirty('images')) {

                    $originalFieldContents = $timeline->getOriginal('images');
                    $newFieldContents = $timeline->images;

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
            } catch (Exception $e) {
                Log::error("Failed to update image in timeline resource", [
                    "timeline_id" => $timeline->id,
                    "message" => $e->getMessage(),
                ]);
                throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
            }
        }
    }

    /**
     * Handle the Timeline "deleted" event.
     */
    public function deleted(Timeline $timeline): void
    {
        try {
            if (! is_null($timeline->images)) {

                # We attempt to JSON decode the field. If it is an array, there are multiple files
                $fieldContentsDecoded = $timeline->images;

                # Simple case: one file
                if (!is_array($fieldContentsDecoded)) {
                    Storage::disk('public')->delete($timeline->images);
                }

                # Complex case: multiple files
                else {

                    foreach ($fieldContentsDecoded as $file) {
                        Storage::disk('public')->delete($file);
                    }
                }
            }
        } catch (Exception $e) {
            Log::error("Failed to delete image in timeline resource", [
                "timeline_id" => $timeline->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }
}
