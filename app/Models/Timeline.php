<?php

namespace App\Models;

use App\Observers\TimelineObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(TimelineObserver::class)]
class Timeline extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'timelines';
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'description',
        'images'
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array'
        ];
    }
}
