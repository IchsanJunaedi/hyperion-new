<?php

namespace App\Http\Controllers;

use App\Models\Hero;
use App\Models\Timeline;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        // Hero
        $hero = Hero::first(['title', 'description']);

        if (!$hero) {
            $hero = (object) ['title' => null, 'description' => null];
        }

        // Timeline
        $timelines = DB::table('timelines')
            ->get(['title', 'description', 'images'])
            ->toArray();

        // Testimonials
        $testimonials = DB::table('testimonials')
            ->get(['name', 'position', 'description', 'image']);

        // Partners
        $partners = DB::table('partners')
            ->get(['image'])
            ->toArray();

        return Inertia::render('home', [
            'heroTitle' => $hero->title,
            'heroDescription' => $hero->description,
            'timelines' => $timelines,
            'testimonials' => $testimonials,
            'partners' => $partners
        ]);
    }
}
