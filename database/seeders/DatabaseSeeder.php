<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            HeroSeeder::class,
            TimelineSeeder::class,
            TestimonialSeeder::class,
            PartnerSeeder::class,
            DivisionSeeder::class,
            GallerySeeder::class,
            AboutSeeder::class,
            TeamSeeder::class
        ]);
    }
}
