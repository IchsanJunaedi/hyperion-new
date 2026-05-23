"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface Achievement {
  year: string;
  title: string;
  description: string;
  images: string[];
}

const ACHIEVEMENTS: Achievement[] = [
  {
    year: "2024",
    title: "Juara 1 Liga Esport Nasional Pelajar 2024",
    description:
      "Ini dia SANG JUARA LIGA ESPORTS NASIONAL PELAJAR 2024 - MOBILE LEGENDS. Perjuangan keras tidak mengkhianati hasil dari kerjasama tim. Tetap semangat dan semoga bisa terus mendapatkan juara.",
    images: [
      "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
    ],
  },
  {
    year: "2024",
    title: "Champion RRQ MABAR Esports Tournament Season 4",
    description:
      "Ribuan pelajar telah bertanding di RRQ MABAR Esports Tournament Season 4 dan inilah juaranya! SMAS Xaverius 1 Palembang berhasil raih back to back champion setelah menang 3-1 di Grand Final melawan SMAK Yos Sudarso Batam.",
    images: [
      "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
    ],
  },
  {
    year: "2023",
    title: "Champion H3RO ROOKIE TOURNAMENT 4.0",
    description:
      "H3RO Esports 4.0 is the 4th edition of the event organized by H3RO. Champion qualifies to Seleknas IESF 2023.",
    images: [
      "https://hyperionteam.id/storage/timelines/01JZPD3RM26KW2BNB68WFYTT6X.jpeg",
    ],
  },
];

export function AchievementsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);

  useEffect(() => {
    if (lineRef.current) {
      setLineHeight(lineRef.current.getBoundingClientRect().height);
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, lineHeight]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <section
      id="achievements"
      className="bg-[#070707] px-6 py-24 sm:px-10 lg:px-16"
      ref={containerRef}
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[#F5C400]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
              Trophy Room
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            OUR ACHIEVEMENT
          </h2>
          <p className="mt-3 max-w-xl text-sm text-white/40">
            We began our journey in 2020. Here are the awards we have received since then.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative mt-16" ref={lineRef}>
          {/* Static track line */}
          <div
            className="absolute bottom-0 left-4 top-0 w-[2px] overflow-hidden md:left-8"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.06) 10%, rgba(255,255,255,0.06) 90%, transparent 100%)",
            }}
          >
            {/* Growing yellow line */}
            <motion.div
              style={{ height: heightTransform, opacity: opacityTransform }}
              className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-[#F5C400] via-[#F5C400] to-transparent"
            />
          </div>

          {ACHIEVEMENTS.map((item, index) => (
            <div key={item.title} className="flex gap-6 py-14 md:gap-12">
              {/* Left: dot + year */}
              <div className="relative z-10 flex shrink-0 flex-col items-center" style={{ width: "2rem" }}>
                <div className="flex h-10 w-10 -translate-x-[calc(50%-1px)] items-center justify-center rounded-full bg-[#070707]">
                  <div className="h-4 w-4 rounded-full border border-[#F5C400]/50 bg-[#070707] p-1">
                    <div className="h-full w-full rounded-full bg-[#F5C400]" />
                  </div>
                </div>
                <span className="mt-3 hidden text-5xl font-black leading-none text-white/[0.05] md:block">
                  {item.year}
                </span>
              </div>

              {/* Right: content */}
              <div className="flex-1 min-w-0 pb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F5C400]/50 md:hidden">
                  {item.year}
                </p>

                <h3 className="text-lg font-black uppercase leading-tight tracking-tight text-white sm:text-xl lg:text-2xl">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {item.description}
                </p>

                {item.images.length > 0 && (
                  <div
                    className={`mt-6 gap-4 ${
                      item.images.length > 1 ? "grid grid-cols-2" : "block"
                    }`}
                  >
                    {item.images.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt={item.title}
                        loading={index === 0 ? "eager" : "lazy"}
                        className="h-44 w-full rounded-sm object-cover shadow-lg sm:h-52 lg:h-64"
                      />
                    ))}
                  </div>
                )}

                <div className="mt-5">
                  <Link
                    href="/gallery"
                    className="inline-flex items-center gap-2 border border-[#F5C400]/30 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#F5C400] transition hover:border-[#F5C400] hover:bg-[#F5C400]/8"
                  >
                    Load More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
