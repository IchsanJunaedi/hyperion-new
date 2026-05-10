<?php

namespace App\Models;

use App\Observers\DivisionObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy(DivisionObserver::class)]
class Division extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'divisions';
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'slug',
        'achievements',
        'description',
        'status',
        'banner_image',
    ];

    public function players(): HasMany
    {
        return $this->hasMany(Player::class);
    }

    public function galleries(): HasMany
    {
        return $this->hasMany(Gallery::class);
    }
}
