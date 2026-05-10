<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testimonials = [
            [
                'name' => 'RRQ Kaeya',
                'position' => 'Player of Team RRQ',
                'description' => 'Awalnya gue kira bakal biasa aja kayak komunitas lain, tapi ternyata banyak ilmu yang gue dapet dari awal trial sampai akhir. Di Hyperion, gue ketemu banyak orang yang semangat kompetisinya sama, jadi lebih enak buat berkembang. Sering scrim dan ada evaluasi via Discord yang bikin gameplay makin bagus, jadi kenal banyak orang keren di esports yang pastinya nguntungin banget buat ke depannya.',
            ],
            [
                'name' => 'Padjajaran Firlyboy',
                'position' => 'Player of Team Padjajaran',
                'description' => 'Hyperion beda dari komunitas lain—banyak ilmu, sering scrim dan evaluasi, plus ketemu orang-orang kompetitif yang bikin gue terus berkembang. Lingkungannya suportif banget buat ningkatin skill dan ngebuka koneksi di dunia esports.',
            ],
            [
                'name' => 'Onic Fenzu',
                'position' => 'Player of Onic Esport',
                'description' => 'Di Hyperion, gue belajar kalau progres nggak cuma soal skill individu, tapi juga tentang kerja sama tim dan konsistensi. Setiap sesi, mulai dari scrim sampai evaluasi, selalu ada hal baru yang gue dapetin. Pengalaman ini bener-bener ngebentuk cara pikir gue, bukan cuma sebagai player, tapi juga sebagai bagian dari komunitas yang serius berkembang.',
            ],
            [
                'name' => 'Alter Ego Aido',
                'position' => 'Player of Alter Ego',
                'description' => 'Hyperion jadi titik balik buat gue di dunia esports. Bukan cuma soal gameplay, tapi juga mindset dan relasi. Dari awal trial sampai akhir, gue ngerasa terus didorong buat berkembang bareng orang-orang yang satu visi. Lingkungan yang kompetitif tapi suportif kayak gini langka banget.',
            ],
            [
                'name' => 'Navi Hixo',
                'position' => 'Player of Navi',
                'description' => 'Gabung Hyperion bukan cuma soal main bareng, tapi juga tentang belajar teamwork, disiplin, dan komunikasi. Di sini gue nggak cuma jadi player yang lebih baik, tapi juga pribadi yang lebih siap bersaing di dunia esports profesional.',
            ],
        ];

        foreach ($testimonials as $testimonial) {
            Testimonial::create([
                'name' => $testimonial['name'],
                'position' => $testimonial['position'],
                'description' => $testimonial['description'],
            ]);
        }
    }
}
