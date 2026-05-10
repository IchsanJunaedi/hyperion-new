<?php

namespace Database\Seeders;

use App\Models\Division;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DivisionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Division::create([
            'title' => 'Hyperion X',
            'slug' => 'hyperion-x',
            'achievements' => 'Juara 1 Nasional',
            'description' => 'SMK Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam, ipsa.'
        ]);
    }
}
