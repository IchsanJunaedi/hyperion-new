"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Trophy } from "lucide-react";

const ACHIEVEMENTS = [
  {
    year: "2024",
    rank: "#1 National",
    title: "Juara 1 Liga Esport Nasional Pelajar 2024",
    description:
      "SANG JUARA LIGA ESPORTS NASIONAL PELAJAR 2024 — MOBILE LEGENDS. Perjuangan keras tidak mengkhianati hasil dari kerjasama tim yang solid.",
    image:
      "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
  },
  {
    year: "2024",
    rank: "Champion",
    title: "RRQ MABAR Esports Tournament Season 4",
    description:
      "Back to back champion setelah menang 3-1 di Grand Final. SMAS Xaverius 1 Palembang raih gelar berganda melawan SMAK Yos Sudarso Batam.",
    image:
      "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
  },
  {
    year: "2023",
    rank: "Champion",
    title: "H3RO Rookie Tournament 4.0",
    description:
      "H3RO Esports 4.0 — the 4th edition organized by H3RO. Champion qualifies directly to Seleknas IESF 2023.",
    image:
      "https://hyperionteam.id/storage/timelines/01JZPD3RM26KW2BNB68WFYTT6X.jpeg",
  },
] as const;

interface AchievementCardProps {
  item: (typeof ACHIEVEMENTS)[number];
  index: number;
}

const AchievementCard = ({ item, index }: AchievementCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 44 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay: index * 0.13,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group relative overflow-hidden rounded-2xl border border-white/6 transition-all duration-500 hover:border-[#F5C400]/18"
      style={{
        background: "rgba(255,255,255,0.018)",
        backdropFilter: "blur(20px)",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden sm:h-60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title}
          loading={index === 0 ? "eager" : "lazy"}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ filter: "saturate(0.85)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 38%, rgba(5,5,5,0.94) 100%)",
          }}
        />
        {/* Year chip */}
        <div
          className="absolute left-4 top-4 rounded-full px-3 py-1"
          style={{
            background: "rgba(0,0,0,0.68)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/52">
            {item.year}
          </span>
        </div>
        {/* Rank badge */}
        <div className="absolute right-4 top-4">
          <span className="rounded-full bg-[#F5C400] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">
            {item.rank}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-3 w-3 text-[#F5C400]/48" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#F5C400]/48">
            Achievement
          </span>
        </div>
        <h3 className="text-base font-black uppercase leading-snug tracking-tight text-white sm:text-lg">
          {item.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/40">
          {item.description}
        </p>
      </div>

      {/* Hover inner glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: "inset 0 0 80px rgba(245,196,0,0.03)" }}
      />
    </motion.div>
  );
};

const AchievementsSection = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section
      id="achievements"
      className="scroll-mt-16 bg-[#060606] px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mb-14"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[#F5C400]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
              Trophy Room
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            Our Achievement
          </h2>
          <p className="mt-3 max-w-xl text-sm text-white/36">
            We began our journey in 2020. Here are the awards we have received since then.
          </p>
        </motion.div>

        {/* Glass cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((item, i) => (
            <AchievementCard key={item.title} item={item} index={i} />
          ))}
        </div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={headerInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="mt-10 text-center"
        >
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 border border-[#F5C400]/20 px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#F5C400] transition hover:border-[#F5C400]/45 hover:bg-[#F5C400]/5"
          >
            View All in Gallery
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
export { AchievementsSection };
