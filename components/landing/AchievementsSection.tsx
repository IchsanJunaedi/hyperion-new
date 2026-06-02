"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import type { Achievement } from "@/features/admin/queries";

const PLACEMENT_LABEL: Record<number, string> = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };

interface RowProps {
  item: Achievement;
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
      <div className="group relative block overflow-hidden border-b border-white/8">
        {/* Hover-reveal photo */}
        {item.image_url && (
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-full w-full object-cover"
              style={{ filter: "brightness(0.12) grayscale(60%)" }}
            />
          </div>
        )}

        <div className="relative grid grid-cols-[3rem_1fr] items-center gap-4 py-7 sm:grid-cols-[4rem_1fr_auto] sm:gap-8 sm:py-8">
          {/* Number */}
          <span className="text-3xl font-black tabular-nums text-white/12 sm:text-4xl">
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Title + description */}
          <div className="min-w-0">
            <h3 className="text-base font-black uppercase leading-tight tracking-tight text-white sm:text-xl lg:text-2xl">
              {item.title}
            </h3>
            {item.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/32 sm:text-sm">
                {item.description}
              </p>
            )}
          </div>

          {/* Right meta — hidden on mobile */}
          <div className="hidden flex-col items-end gap-2 sm:flex">
            {item.placement != null && (
              <span className="text-[11px] font-black uppercase tracking-widest text-[#F5C400]">
                {PLACEMENT_LABEL[item.placement] ?? `Juara ${item.placement}`}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/28">
              {item.achieved_at?.slice(0, 4)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface AchievementsSectionProps {
  entries: Achievement[];
}

const AchievementsSection = ({ entries }: AchievementsSectionProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });

  if (entries.length === 0) return null;

  return (
    <section id="achievements" className="scroll-mt-14 bg-black px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
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
          </div>
        </motion.div>

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
