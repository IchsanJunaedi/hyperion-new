<?php

namespace App\Models;

use App\Observers\PlayerObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy(PlayerObserver::class)]
class Player extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'players';
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'role',
        'nickname',
        'status',
        'image',
        'division_id',
    ];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }
}
