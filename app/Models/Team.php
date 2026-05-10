<?php

namespace App\Models;

use App\Observers\TeamObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(TeamObserver::class)]
class Team extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'teams';
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'role',
        'image',
    ];
}
