<?php

namespace Database\Seeders;

use App\Models\Hero;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class HeroSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Hero::create([
            'title' => 'HYPERION TEAM',
            'description' => 'Unleash Young Potential Power. Focus of Develop Young Player #HypeWin'
        ]);
    }
}
