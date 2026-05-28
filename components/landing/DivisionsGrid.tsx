"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";

const GAME_META: Record<string, { color: string; abbr: string }> = {
  "mobile legends": { color: "#F5C400", abbr: "MLBB" },
  mobile_legends: { color: "#F5C400", abbr: "MLBB" },
  pubg: { color: "#F97316", abbr: "PUBG" },
  "pubg mobile": { color: "#F97316", abbr: "PUBGM" },
  "free fire": { color: "#22C55E", abbr: "FF" },
};

function getMeta(game: string) {
  const key = game.toLowerCase();
  return (
    GAME_META[key] ?? { color: "#9B9A97", abbr: game.slice(0, 4).toUpperCase() }
  );
}

interface Division {
  id: string;
  name: string;
  slug: string;
  game: string | null;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
}

interface DivisionsGridProps {
  divisions: Division[];
}

const DivisionsGrid = ({ divisions }: DivisionsGridProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <>
      {/* Section header */}
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
        className="mb-12 flex items-end justify-between"
      >
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[#F5C400]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
              Our Teams
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            Divisions
          </h2>
        </div>
        <Link
          href="/divisions"
          className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/35 transition hover:text-[#F5C400] sm:flex"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </motion.div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {divisions.map((div, index) => {
          const meta = getMeta(div.game ?? "");
          const isPrimary = index === 0;
          return (
            <motion.div
              key={div.id}
              initial={{ opacity: 0, y: 36 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.65,
                delay: index * 0.1 + 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="group relative overflow-hidden rounded-2xl border transition-all duration-500"
              style={{
                borderColor: isPrimary
                  ? `${meta.color}26`
                  : "rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.018)",
                backdropFilter: "blur(16px)",
                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {/* Top accent line */}
              <div
                className="h-0.5 w-full"
                style={{
                  background: isPrimary
                    ? `linear-gradient(to right, ${meta.color}, transparent)`
                    : "rgba(255,255,255,0.05)",
                }}
              />

              <div className="p-6">
                {/* Active badge */}
                <div className="mb-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{
                      background: isPrimary
                        ? `${meta.color}10`
                        : "rgba(255,255,255,0.04)",
                      color: isPrimary ? meta.color : "rgba(255,255,255,0.26)",
                      border: `1px solid ${
                        isPrimary
                          ? `${meta.color}26`
                          : "rgba(255,255,255,0.07)"
                      }`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: isPrimary
                          ? meta.color
                          : "rgba(255,255,255,0.18)",
                      }}
                    />
                    Active
                  </span>
                </div>

                {/* Game abbreviation */}
                <p
                  className="text-5xl font-black uppercase leading-none tracking-tighter"
                  style={{
                    color: isPrimary ? meta.color : "rgba(255,255,255,0.08)",
                    textShadow: isPrimary
                      ? `0 0 40px ${meta.color}35`
                      : "none",
                  }}
                >
                  {meta.abbr}
                </p>

                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/26">
                  {div.name}
                </p>

                <p className="mt-4 text-sm leading-relaxed text-white/42">
                  {div.description ??
                    "Divisi kompetitif aktif berlaga di berbagai turnamen nasional dan regional."}
                </p>

                <div className="mt-6">
                  <Link
                    href={`/divisions/${div.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:gap-3"
                    style={{
                      color: isPrimary ? meta.color : "rgba(255,255,255,0.18)",
                    }}
                  >
                    Lihat Tim <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ boxShadow: `inset 0 0 80px ${meta.color}07` }}
              />
            </motion.div>
          );
        })}
      </div>
    </>
  );
};
export { DivisionsGrid };
