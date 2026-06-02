"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import type { GalleryEntry } from "@/features/admin/queries";

interface RowProps {
  item: GalleryEntry;
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
    >
      <Link
        href={`/gallery/${item.slug}`}
        className="group relative block overflow-hidden border-b border-white/8 cursor-pointer"
      >
        {/* Hover-reveal photo */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.preview_images[0] ?? ""}
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
            {String(index + 1).padStart(2, "0")}
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
          <div className="hidden flex-col items-end gap-2 sm:flex">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#F5C400]">
              {item.position}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/28">
              {item.tournament_date}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 transition-colors duration-300 group-hover:text-white/50">
              View →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

interface AchievementsSectionProps {
  entries: GalleryEntry[];
}

const AchievementsSection = ({ entries }: AchievementsSectionProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });

  if (entries.length === 0) return null;

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
          {entries.map((item, i) => (
            <AchievementRow key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
export { AchievementsSection };
