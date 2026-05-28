"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";

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
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="mb-0 border-b border-white/8 pb-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">
              02 — Our Teams
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Divisions
            </h2>
          </div>
          <Link
            href="/divisions"
            className="text-[11px] font-bold uppercase tracking-widest text-white/35 transition hover:text-white"
          >
            View All →
          </Link>
        </div>
      </motion.div>

      {/* Division rows */}
      <div>
        {divisions.map((div, index) => {
          const meta = getMeta(div.game ?? "");
          return (
            <motion.div
              key={div.id}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.45,
                delay: index * 0.07 + 0.1,
                ease: "easeOut",
              }}
              className="group border-b border-white/8"
            >
              <Link
                href={`/divisions/${div.slug}`}
                className="grid grid-cols-[3.5rem_1fr] items-center gap-4 py-6 sm:grid-cols-[5rem_1fr_auto] sm:gap-8"
              >
                {/* Game abbreviation */}
                <span
                  className="text-2xl font-black uppercase leading-none tracking-tighter sm:text-3xl"
                  style={{ color: meta.color }}
                >
                  {meta.abbr}
                </span>

                {/* Name + description */}
                <div className="min-w-0">
                  <p className="font-black uppercase leading-tight tracking-tight text-white transition-colors duration-200 group-hover:text-[#F5C400] sm:text-lg">
                    {div.name}
                  </p>
                  {div.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-white/32">
                      {div.description}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <span className="hidden text-[11px] font-bold uppercase tracking-widest text-white/22 transition-colors duration-200 group-hover:text-white sm:block">
                  Open →
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </>
  );
};
export { DivisionsGrid };
