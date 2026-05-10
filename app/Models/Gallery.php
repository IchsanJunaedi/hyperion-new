<?php

namespace App\Models;

use App\Observers\GalleryObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy(GalleryObserver::class)]
class Gallery extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'galleries';
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'slug',
        'division_id',
        'tournament_date',
        'position',
        'status',
        'preview_images',
        'images',
        'logo',
        'description'
    ];

    protected function casts(): array
    {
        return [
            'preview_images' => 'array',
            'images' => 'array',
        ];
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }
}
