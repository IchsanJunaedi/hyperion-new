<?php

namespace Database\Seeders;

use App\Models\About;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AboutSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        About::create([
            'first_description' => 'Dari bara kecil, lahirlah cahaya yang tak pernah padam. Hyperion bermula pada tahun 2020 sebagai sebuah komunitas kecil di Mobile Legends: Bang Bang. Bukan sekadar tim, kami adalah tempat lahirnya semangat, kerja keras, dan mimpi besar. Kami percaya bahwa talenta hebat tak datang begitu saja — mereka dibentuk, dibimbing, dan diberi ruang untuk tumbuh. Maka dari itu, Hyperion hadir sebagai inkubator bagi para pemain muda, menciptakan jalur nyata menuju panggung tertinggi Esports. Dengan prestasi yang terus tumbuh, komunitas yang solid, dan semangat untuk terus berkembang lintas game, satu hal tetap kami jaga komitmen untuk menjadi rumah bagi mereka yang mencintai Esports sepenuh hati. ',
            'second_description' => 'Berpegang pada nilai dan prinsip yang kami yakini, Hyperion tumbuh menjadi tim yang diperhitungkan — mencetak prestasi, membentuk talenta, dan membangun komunitas yang terus berkembang. ',
            'vision' => 'Menjadi tempat pertama yang terlintas di benak siapa pun yang ingin melangkah menuju dunia Esports profesional. Hyperion hadir bukan sekadar sebagai tim, tetapi sebagai ekosistem yang membina, membimbing, dan membuka jalan bagi generasi muda untuk berkembang menjadi pro player.',
            'mission' => 'Hyperion hadir untuk menciptakan ruang berkembang bagi para talenta muda di dunia Esports. Melalui pembinaan yang konsisten, partisipasi dalam turnamen nasional, dan pengembangan akademi, kami membangun jalur nyata bagi generasi berikutnya untuk mencapai panggung profesional. Kami juga berkomitmen untuk menghadirkan konten edukatif serta aktivitas komunitas yang memperkuat hubungan antar pemain dan memperluas dampak positif Esports di luar arena pertandingan. Ekspansi ke berbagai game menjadi langkah strategis kami untuk membuka lebih banyak peluang dan mewadahi potensi anak muda Indonesia.',
            'values' => 'Kami percaya bahwa fondasi dari tim yang hebat terletak pada nilai-nilai yang kokoh. Di Hyperion, disiplin bukan hanya soal waktu, tapi juga tentang komitmen terhadap proses. Etika menjadi prinsip yang kami junjung dalam setiap interaksi, sementara kerja keras adalah bahan bakar utama dalam setiap latihan dan pertandingan. Kami menanamkan rasa hormat sebagai dasar dari kolaborasi, baik antar pemain, pelatih, maupun komunitas. Kedekatan usia antara pelatih dan pemain membentuk ikatan kepercayaan yang unik, menjadikan Hyperion bukan hanya tempat berlatih, tapi juga rumah bagi mereka yang ingin tumbuh dan berjuang bersama.'
        ]);
    }
}
