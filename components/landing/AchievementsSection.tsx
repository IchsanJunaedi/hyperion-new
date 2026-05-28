"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";

const ACHIEVEMENTS = [
  {
    num: "01",
    year: "2024",
    rank: "#1 National",
    title: "Liga Esport Nasional Pelajar 2024",
    description:
      "SANG JUARA LIGA ESPORTS NASIONAL PELAJAR 2024 — MOBILE LEGENDS. Perjuangan keras tidak mengkhianati hasil dari kerjasama tim yang solid.",
    image:
      "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
  },
  {
    num: "02",
    year: "2024",
    rank: "Champion",
    title: "RRQ MABAR Esports Tournament Season 4",
    description:
      "Back to back champion setelah menang 3-1 di Grand Final. SMAS Xaverius 1 Palembang raih gelar berganda melawan SMAK Yos Sudarso Batam.",
    image:
      "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
  },
  {
    num: "03",
    year: "2023",
    rank: "Champion",
    title: "H3RO Rookie Tournament 4.0",
    description:
      "H3RO Esports 4.0 — the 4th edition organized by H3RO. Champion qualifies directly to Seleknas IESF 2023.",
    image:
      "https://hyperionteam.id/storage/timelines/01JZPD3RM26KW2BNB68WFYTT6X.jpeg",
  },
] as const;

interface RowProps {
  item: (typeof ACHIEVEMENTS)[number];
  index: number;
}

const AchievementRow = ({ item, index }: RowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className="group relative overflow-hidden border-b border-white/8"
    >
      {/* Hover-reveal photo */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-full w-full object-cover"
          style={{ filter: "brightness(0.12) grayscale(60%)" }}
        />
      </div>

      <div className="relative grid grid-cols-[3rem_1fr] items-center gap-4 py-7 sm:grid-cols-[4rem_1fr_auto] sm:gap-8 sm:py-8">
        {/* Number */}
        <span className="text-3xl font-black tabular-nums text-white/12 sm:text-4xl">
          {item.num}
        </span>

        {/* Title + description */}
        <div className="min-w-0">
          <h3 className="text-base font-black uppercase leading-tight tracking-tight text-white transition-colors duration-300 group-hover:text-[#F5C400] sm:text-xl lg:text-2xl">
            {item.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/32 sm:text-sm">
            {item.description}
          </p>
        </div>

        {/* Right meta — hidden on mobile, shown sm+ */}
        <div className="hidden flex-col items-end gap-1 sm:flex">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#F5C400]">
            {item.rank}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/28">
            {item.year}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const AchievementsSection = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section
      id="achievements"
      className="scroll-mt-14 bg-black px-5 py-20 sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header row */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 16 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-0 border-b border-white/8 pb-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">
                01 — Trophy Room
              </p>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                Our Achievement
              </h2>
            </div>
            <Link
              href="/gallery"
              className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-white/35 transition hover:text-white"
            >
              All in Gallery →
            </Link>
          </div>
        </motion.div>

        {/* Achievement rows */}
        <div>
          {ACHIEVEMENTS.map((item, i) => (
            <AchievementRow key={item.num} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
export { AchievementsSection };
