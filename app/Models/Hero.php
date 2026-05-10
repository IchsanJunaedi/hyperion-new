<?php

namespace App\Models;

use App\Observers\HeroObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(HeroObserver::class)]
class Hero extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'heroes';
    protected $keyType = 'string';

    protected $fillable = [
        'logo',
        'title',
        'description',
    ];
}
