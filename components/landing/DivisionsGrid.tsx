"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const GAME_META: Record<string, { color: string; abbr: string }> = {
  "mobile legends": { color: "#F5C400", abbr: "MLBB" },
  mobile_legends: { color: "#F5C400", abbr: "MLBB" },
  pubg: { color: "#F97316", abbr: "PUBG" },
  "pubg mobile": { color: "#F97316", abbr: "PUBGM" },
  "free fire": { color: "#22C55E", abbr: "FF" },
};

function getMeta(game: string) {
  const key = game.toLowerCase();
  return GAME_META[key] ?? { color: "#9B9A97", abbr: game.slice(0, 4).toUpperCase() };
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
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!headerRef.current) return;
    const trigger = {
      trigger: headerRef.current,
      start: "top bottom-=60",
      once: true,
    };
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, scrollTrigger: trigger }
    );
    if (!gridRef.current) return;
    gsap.fromTo(
      Array.from(gridRef.current.children),
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: "power2.out",
        stagger: 0.07,
        delay: 0.1,
        scrollTrigger: trigger,
      }
    );
  });

  return (
    <>
      <div
        ref={headerRef}
        className="mb-8 border-b border-white/12 pb-8"
        style={{ opacity: 0 }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
              02 — Our Teams
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Divisions
            </h2>
          </div>
          <Link
            href="/divisions"
            className="text-[11px] font-bold uppercase tracking-widest text-white/45 transition hover:text-white"
          >
            View All →
          </Link>
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {divisions.map((div) => {
          const meta = getMeta(div.game ?? "");
          return (
            <div key={div.id} style={{ opacity: 0 }}>
              <Link
                href={`/divisions/${div.slug}`}
                className="group flex flex-col gap-3 border border-white/10 bg-[#071428] p-5 transition-all duration-200 hover:border-[#F5C400]/50 hover:bg-[#0C1E3C] sm:p-6"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="text-2xl font-black uppercase leading-none tracking-tighter"
                    style={{ color: meta.color }}
                  >
                    {meta.abbr}
                  </span>
                  <span className="text-sm text-white/25 transition-colors group-hover:text-[#F5C400]">→</span>
                </div>
                <div>
                  <p className="font-black uppercase leading-tight tracking-tight text-white sm:text-sm">
                    {div.name}
                  </p>
                  {div.description && (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-white/45">
                      {div.description}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
};
export { DivisionsGrid };
