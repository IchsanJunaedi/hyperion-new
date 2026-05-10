<?php

namespace Database\Seeders;

use App\Models\Timeline;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TimelineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $timelines = [
            [
                'title' => 'Juara 1 Liga Esport Nasional Pelajar 2024',
                'description' => 'Ini dia SANG JUARA LIGA ESPORTS NASIONAL PELAJAR 2024 - MOBILE LEGENDS🔥🔥 Perjuangan keras tidak mengkhianati hasil darikerjasama tim. Tetap semangat dan semoga bisa terus mendapatkan juara✨',
                'images' => null
            ],
            [
                'title' => 'Champion RRQ MABAR Esports Tournament Season 4',
                'description' => 'Ribuan pelajar telah bertanding di RRQ MABAR Esports Tournament Season 4 dan inilah juaranya! SMAS Xaverius 1 Palembang berhasil raih back to back champion setelah menang 3-1 di Grand Final RRQ MABAR National Chmapionship melawan SMAK Yos Sudarso Batam.',
                'images' => null
            ],
            [
                'title' => 'Champion H3RO ROOKIE TOURNAMENT 4.0',
                'description' => 'H3RO Esports 4.0 is the 4th edition of the event organized by H3RO. Champion qualifies to Seleknas IESF 2023',
                'images' => null
            ],
        ];

        foreach ($timelines as $timeline) {
            Timeline::create([
                'title' => $timeline['title'],
                'description' => $timeline['description'],
                'images' => $timeline['images'],
            ]);
        }
    }
}
