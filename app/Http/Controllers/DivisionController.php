<?php

namespace App\Http\Controllers;

use App\Models\Division;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DivisionController extends Controller
{
    public function index($title = 'mobile-legends'): Response
    {
        if ($title === 'mobile-legends') {
            $divisions = DB::table('divisions')
                ->get(['title', 'slug', 'description', 'status', 'banner_image'])
                ->toArray();

            return Inertia::render('divisions/index', [
                'divisions' => $divisions
            ]);
        }

        return abort(404);
    }

    public function show(string $title = 'mobile-legends', string $slug): Response
    {
        if ($title !== 'mobile-legends') {
            return abort(404);
        }

        $division = Division::where('slug', $slug)->first(['title', 'description', 'status', 'achievements']);

        if (!$division) {
            return abort(404);
        }

        $players = DB::table('divisions')
            ->join('players', 'divisions.id', 'players.division_id')
            ->where('divisions.slug', $slug)
            ->select(
                'players.name',
                'players.nickname',
                'players.role',
                'players.image'
            )
            ->get()
            ->toArray();

        if (!$players) {
            return abort(404);
        }

        return Inertia::render('divisions/show', [
            'players' => $players,
            'divisionTitle' => $division->title,
            'divisionDescription' => $division->description,
            'divisionAchievements' => $division->achievements,
            'divisionStatus' => $division->status,
        ]);
    }
}
