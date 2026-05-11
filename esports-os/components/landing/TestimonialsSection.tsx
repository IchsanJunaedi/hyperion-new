"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

interface Testimonial {
  name: string;
  team: string;
  quote: string;
  imageUrl: string;
}

// Hardcoded to match live site visuals; will move to Supabase later.
const TESTIMONIALS: Testimonial[] = [
  {
    name: "RRQ Kaeya",
    team: "Player of Team RRQ",
    quote:
      "Awalnya gue kira bakal biasa aja kayak komunitas lain, tapi ternyata banyak ilmu yang gue dapet dari awal trial sampai akhir. Di Hyperion, gue ketemu banyak orang yang semangat kompetisinya sama, jadi lebih enak buat berkembang. Sering scrim dan ada evaluasi via Discord yang bikin gameplay makin bagus, jadi kenal banyak orang keren di esports yang pastinya nguntungin banget buat ke depannya.",
    imageUrl:
      "https://hyperionteam.id/storage/testimonials/01K2SMTH386QV9Q3R8PTF7913YR.png",
  },
  {
    name: "Evos Rendyy",
    team: "Team of Evos Esports",
    quote:
      "Gue mulai bareng Hyperion BLCK di awal 2023 dan berhasil juara di banyak turnamen nasional pelajar. Setelah itu gue lanjut bareng Hyperion Palembang di DGWIB 2024 bersama Fenzu, yang jadi pengalaman penting buat ngasah mental tanding dan konsistensi. Semua proses itu jadi fondasi kuat sampai akhirnya gue bisa tembus ke EVOS. Buat gue, Hyperion adalah titik awal perjalanan gue di scene profesional.",
    imageUrl:
      "https://hyperionteam.id/storage/testimonials/01K2RYQS6A36J458VGK7DE8AS9.png",
  },
  {
    name: "Pajajaran Firlyboy",
    team: "Player of Team Pajajaran",
    quote:
      "Hyperion jadi titik awal penting buat perjalanan gue di esports. Di sini gue nggak cuma belajar mekanik, tapi juga disiplin, mindset, dan cara bersaing sehat. Semua itu ngebantu banget waktu gue masuk ke Seleknas Pajajaran 2024, dan gue yakin tanpa Hyperion gue nggak bakal sampai di tahap ini.",
    imageUrl:
      "https://hyperionteam.id/storage/testimonials/01K2RYVPWSFF8GGREVCD4VKRRH.png",
  },
];

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const total = TESTIMONIALS.length;
  const t = TESTIMONIALS[index]!;

  return (
    <section className="px-6 py-24 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-semibold text-white sm:text-4xl">
          Testimonials
        </h2>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="flex justify-center lg:justify-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.imageUrl}
              alt={t.name}
              loading="lazy"
              className="h-72 w-auto object-contain sm:h-80"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              {t.name}
            </h3>
            <p className="mt-1 text-sm text-white/55">{t.team}</p>
            <p className="mt-6 text-sm leading-relaxed text-white/85 sm:text-base">
              {t.quote}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous testimonial"
                onClick={() => setIndex((i) => (i - 1 + total) % total)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-white/80 transition hover:bg-zinc-700 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next testimonial"
                onClick={() => setIndex((i) => (i + 1) % total)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-white/80 transition hover:bg-zinc-700 hover:text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
