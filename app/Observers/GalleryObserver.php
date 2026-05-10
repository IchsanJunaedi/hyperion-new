<?php

namespace App\Observers;

use App\Models\Gallery;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GalleryObserver
{
    public function updated(Gallery $gallery): void
    {
        try {
            if ($gallery->getOriginal('preview_images') != null) {
                if ($gallery->isDirty('preview_images')) {

                    $originalFieldContents = $gallery->getOriginal('preview_images');
                    $newFieldContents = $gallery->preview_images;

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

            if ($gallery->getOriginal('images') != null) {
                if ($gallery->isDirty('images')) {

                    $originalFieldContents = $gallery->getOriginal('images');
                    $newFieldContents = $gallery->images;

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

            if ($gallery->isDirty('logo') && $gallery->getOriginal('logo') != null) {
                Storage::disk('public')->delete($gallery->getOriginal('logo'));
            }
        } catch (Exception $e) {
            Log::error("Failed to update logo in gallery resource", [
                "gallery_id" => $gallery->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }

    public function deleted(Gallery $gallery): void
    {
        try {
            if (! is_null($gallery->preview_images)) {

                # We attempt to JSON decode the field. If it is an array, there are multiple files
                $fieldContentsDecoded = $gallery->preview_images;

                # Simple case: one file
                if (!is_array($fieldContentsDecoded)) {
                    Storage::disk('public')->delete($gallery->preview_images);
                }

                # Complex case: multiple files
                else {

                    foreach ($fieldContentsDecoded as $file) {
                        Storage::disk('public')->delete($file);
                    }
                }
            }

            if (! is_null($gallery->images)) {

                # We attempt to JSON decode the field. If it is an array, there are multiple files
                $fieldContentsDecoded = $gallery->images;

                # Simple case: one file
                if (!is_array($fieldContentsDecoded)) {
                    Storage::disk('public')->delete($gallery->images);
                }

                # Complex case: multiple files
                else {

                    foreach ($fieldContentsDecoded as $file) {
                        Storage::disk('public')->delete($file);
                    }
                }
            }

            if ($gallery->logo) {
                Storage::disk('public')->delete($gallery->logo);
            }
        } catch (Exception $e) {
            Log::error("Failed to delete logo in gallery resource", [
                "gallery_id" => $gallery->id,
                "message" => $e->getMessage(),
            ]);
            throw new Exception("Terjadi kesalahan saat memproses. Silahkan coba lagi nanti.");
        }
    }
}
