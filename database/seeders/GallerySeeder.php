<?php

namespace Database\Seeders;

use App\Models\Gallery;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GallerySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $divisionId = DB::table('divisions')->first(['id']);

        Gallery::create([
            'title' => 'RRQ Mabar',
            'slug' => 'rrq-mabar',
            'division_id' => $divisionId->id,
            'tournament_date' => now()->format('Y-m-d'),
            'position' => 1,
            'status' => 'online',
            'description' => 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Laudantium quo earum, illo voluptatem quia, voluptates atque molestiae quam eum similique cupiditate sunt suscipit magni at in quas unde amet excepturi.'
        ]);
    }
}
