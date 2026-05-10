<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GalleryController extends Controller
{
    public function index(): Response
    {
        $galleries = DB::table('galleries')
            ->join('divisions', 'galleries.division_id', 'divisions.id')
            ->select([
                'galleries.title',
                'galleries.slug',
                'divisions.title as division',
                'galleries.tournament_date',
                'galleries.position',
                'galleries.status',
                'galleries.preview_images',
                'galleries.logo'
            ])
            ->get()
            ->toArray();

        return Inertia::render('gallery/index', [
            'galleries' => $galleries,
        ]);
    }

    public function show($slug)
    {
        $gallery = DB::table('galleries')
            ->join('divisions', 'galleries.division_id', 'divisions.id')
            ->where('galleries.slug', $slug)
            ->select([
                'galleries.title',
                'divisions.title as division',
                'galleries.tournament_date',
                'galleries.position',
                'galleries.status',
                'galleries.images',
                'galleries.description',
            ])
            ->get()
            ->toArray();

        $title = $gallery[0]->title;

        return Inertia::render('gallery/show', [
            'gallery' => $gallery,
            'title' => $title
        ]);
    }
}
