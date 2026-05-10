<?php

namespace App\Models;

use App\Observers\TestimonialObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[ObservedBy(TestimonialObserver::class)]
class Testimonial extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'testimonials';
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'position',
        'description',
        'image'
    ];
}
