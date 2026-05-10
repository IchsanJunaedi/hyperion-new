<?php

namespace App\Models;

use App\Observers\AboutObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(AboutObserver::class)]
class About extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'abouts';
    protected $keyType = 'string';

    protected $fillable = [
        'first_description',
        'second_description',
        'parallax_images',
        'banner',
        'vision',
        'mision',
        'values',
    ];

    protected function casts(): array
    {
        return [
            'parallax_images' => 'array',
        ];
    }
}
