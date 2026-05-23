"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  team: string;
  quote: string;
  imageUrl: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "RRQ Kaeya",
    team: "Player of Team RRQ",
    quote:
      "Awalnya gue kira bakal biasa aja kayak komunitas lain, tapi ternyata banyak ilmu yang gue dapet dari awal trial sampai akhir. Di Hyperion, gue ketemu banyak orang yang semangat kompetisinya sama, jadi lebih enak buat berkembang. Sering scrim dan ada evaluasi via Discord yang bikin gameplay makin bagus.",
    imageUrl:
      "https://hyperionteam.id/storage/testimonials/01K2SMTH386QV9Q3R8PTF7913YR.png",
  },
  {
    name: "Evos Rendyy",
    team: "Team of Evos Esports",
    quote:
      "Gue mulai bareng Hyperion BLCK di awal 2023 dan berhasil juara di banyak turnamen nasional pelajar. Setelah itu gue lanjut bareng Hyperion Palembang di DGWIB 2024 bersama Fenzu. Buat gue, Hyperion adalah titik awal perjalanan gue di scene profesional.",
    imageUrl:
      "https://hyperionteam.id/storage/testimonials/01K2RYQS6A36J458VGK7DE8AS9.png",
  },
  {
    name: "Pajajaran Firlyboy",
    team: "Player of Team Pajajaran",
    quote:
      "Hyperion jadi titik awal penting buat perjalanan gue di esports. Di sini gue nggak cuma belajar mekanik, tapi juga disiplin, mindset, dan cara bersaing sehat. Semua itu ngebantu banget waktu gue masuk ke Seleknas Pajajaran 2024.",
    imageUrl:
      "https://hyperionteam.id/storage/testimonials/01K2RYVPWSFF8GGREVCD4VKRRH.png",
  },
];

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const total = TESTIMONIALS.length;
  const t = TESTIMONIALS[index]!;

  return (
    <section className="bg-[#070707] px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-12">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[#F5C400]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
              Alumni
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            TESTIMONIALS
          </h2>
        </div>

        {/* Card */}
        <div className="grid border border-white/5 bg-[#0D0D0D] lg:grid-cols-[1fr_340px]">
          {/* Left: quote */}
          <div className="relative p-8 sm:p-10 lg:p-14">
            {/* Big quote icon */}
            <Quote
              className="mb-6 h-10 w-10 text-[#F5C400]/25"
              fill="currentColor"
            />

            <p className="text-base leading-relaxed text-white/75 sm:text-lg sm:leading-relaxed">
              &ldquo;{t.quote}&rdquo;
            </p>

            <div className="mt-8 border-t border-white/5 pt-6">
              <p className="text-base font-black uppercase tracking-wide text-white">
                {t.name}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#F5C400]/60">
                {t.team}
              </p>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous"
                onClick={() => setIndex((i) => (i - 1 + total) % total)}
                className="flex h-9 w-9 items-center justify-center border border-white/10 text-white/50 transition hover:border-[#F5C400]/40 hover:text-[#F5C400]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={() => setIndex((i) => (i + 1) % total)}
                className="flex h-9 w-9 items-center justify-center border border-white/10 text-white/50 transition hover:border-[#F5C400]/40 hover:text-[#F5C400]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="ml-2 text-xs text-white/25 tabular-nums">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </div>

            {/* Top-right corner accent */}
            <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-[#F5C400]/20" />
          </div>

          {/* Right: player photo */}
          <div className="hidden overflow-hidden lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.imageUrl}
              alt={t.name}
              className="h-full w-full object-cover object-top transition duration-500"
              style={{ filter: "saturate(0.85)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
