<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AboutController extends Controller
{
    public function index(): Response
    {
        $about = DB::table('abouts')->first();

        if (!$about) {
            $about = (object)[
                'first_description' => null,
                'second_description' => null,
                'vision' => null,
                'mission' => null,
                'values' => null,
                'parallax_images' => null,
                'banner' => null,
            ];
        }

        $teams = DB::table('teams')->select(['name', 'role', 'image'])->get();

        return Inertia::render('about', [
            'firstDescription' => $about->first_description,
            'secondDescription' => $about->second_description,
            'vision' => $about->vision,
            'mission' => $about->mission,
            'values' => $about->values,
            'banner' => $about->banner,
            'parallax_images' => $about->parallax_images,
            'teams' => $teams,
        ]);
    }
}
