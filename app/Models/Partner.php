<?php

namespace App\Models;

use App\Observers\PartnerObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(PartnerObserver::class)]
class Partner extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'partners';
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'image'
    ];
}
