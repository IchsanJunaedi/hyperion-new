import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

const DIVISIONS = [
  {
    game: "Mobile Legends: Bang Bang",
    abbr: "MLBB",
    description:
      "Tim utama kami aktif berlaga di turnamen nasional & regional. Juara Liga Esport Nasional Pelajar 2024 dan berbagai turnamen bergengsi.",
    color: "#F5C400",
    gradient: "from-yellow-900/60 via-black/80 to-black",
    active: true,
    badge: "ACTIVE",
    href: "/divisions",
  },
  {
    game: "PUBG Mobile",
    abbr: "PUBGM",
    description: "Divisi battle royale sedang dalam tahap pembentukan. Siap menghadirkan roster terbaik.",
    color: "#F97316",
    gradient: "from-orange-900/60 via-black/80 to-black",
    active: false,
    badge: "COMING SOON",
    href: null,
  },
  {
    game: "Free Fire",
    abbr: "FF",
    description: "Tim kompetitif Free Fire akan segera hadir dan siap bersaing di kancah nasional.",
    color: "#22C55E",
    gradient: "from-green-900/60 via-black/80 to-black",
    active: false,
    badge: "COMING SOON",
    href: null,
  },
] as const;

export function DivisionsSection() {
  return (
    <section className="bg-[#070707] px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                Our Teams
              </span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              DIVISIONS
            </h2>
          </div>
          <Link
            href="/divisions"
            className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 transition hover:text-[#F5C400] sm:flex"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIVISIONS.map((div) => (
            <div
              key={div.abbr}
              className="group relative overflow-hidden border border-white/5 bg-[#0D0D0D] transition-all duration-300 hover:border-white/10"
              style={div.active ? { borderColor: "rgba(245,196,0,0.2)" } : {}}
            >
              {/* Top gradient bar */}
              <div
                className="h-1 w-full"
                style={{ background: div.active ? div.color : "rgba(255,255,255,0.06)" }}
              />

              <div className="p-6">
                {/* Badge */}
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{
                      background: div.active
                        ? "rgba(245,196,0,0.12)"
                        : "rgba(255,255,255,0.05)",
                      color: div.active ? "#F5C400" : "rgba(255,255,255,0.3)",
                      border: `1px solid ${div.active ? "rgba(245,196,0,0.25)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    {div.active ? (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#F5C400]" />
                    ) : (
                      <Clock className="h-2.5 w-2.5" />
                    )}
                    {div.badge}
                  </span>
                </div>

                {/* Abbr */}
                <p
                  className="text-5xl font-black uppercase leading-none tracking-tighter"
                  style={{
                    color: div.active ? div.color : "rgba(255,255,255,0.1)",
                    textShadow: div.active
                      ? `0 0 40px ${div.color}33`
                      : "none",
                  }}
                >
                  {div.abbr}
                </p>

                {/* Full name */}
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/30">
                  {div.game}
                </p>

                {/* Description */}
                <p className="mt-4 text-sm leading-relaxed text-white/50">
                  {div.description}
                </p>

                {/* CTA */}
                <div className="mt-6">
                  {div.active && div.href ? (
                    <Link
                      href={div.href}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:gap-3"
                    >
                      Lihat Divisi <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-white/20">
                      Segera Hadir
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom corner accent on active */}
              {div.active && (
                <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-[#F5C400]/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
