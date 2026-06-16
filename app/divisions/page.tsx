import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const GAME_META: Record<string, { color: string; abbr: string }> = {
  "mobile legends": { color: "#F5C400", abbr: "MLBB" },
  "mobile_legends": { color: "#F5C400", abbr: "MLBB" },
  "pubg":           { color: "#F97316", abbr: "PUBG" },
  "pubg mobile":    { color: "#F97316", abbr: "PUBGM" },
  "free fire":      { color: "#22C55E", abbr: "FF" },
};

function getMeta(game: string) {
  return GAME_META[game.toLowerCase()] ?? { color: "#9B9A97", abbr: game.slice(0, 4).toUpperCase() };
}

async function DivisionsPage() {
  const admin = createAdminClient();

  const { data: divisions, error } = await admin
    .from("divisions")
    .select("id, name, slug, game, description, is_active, organizations(name, slug)")
    .eq("is_public", true)
    .order("name")
    .limit(50);
  if (error) console.error("DivisionsPage:", error);

  const items = (divisions ?? []).map((d) => {
    const org = d.organizations as unknown as { name: string; slug: string } | null;
    return { ...d, org };
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] bg-gradient-to-r from-[#FFF099] via-[#F5C400] to-[#C79600] bg-clip-text text-transparent">
                Hyperion Team
              </span>
            </div>
            <h1 className="font-bebas text-6xl sm:text-7xl lg:text-8xl font-black uppercase tracking-wide text-white leading-none">
              DIVISIONS
            </h1>
            <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-white/55">
              Hyperion Team berlaga di berbagai game kompetitif. Pilih divisi untuk melihat roster tim.
            </p>
          </div>
        </section>

        {/* Division cards */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((div) => {
                const meta = getMeta(div.game ?? "");
                return (
                  <Link
                    key={div.id}
                    href={`/divisions/${div.slug}`}
                    className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-gradient-to-b from-[#0a1931]/60 to-[#071428]/80 p-8 backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/60"
                  >
                    {/* Radial background glow (expands on hover) */}
                    <div
                      className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[80px] opacity-10 transition-all duration-500 group-hover:scale-110 group-hover:opacity-20"
                      style={{ backgroundColor: meta.color }}
                    />

                    {/* Dotted Tactical Grid Overlay */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay transition-opacity duration-500 group-hover:opacity-[0.08]"
                      style={{
                        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
                        backgroundSize: "16px 16px",
                      }}
                    />

                    {/* Active/Upcoming Status Indicator Tag */}
                    <div className="absolute top-5 right-6 flex items-center gap-1.5" style={{ border: 'none' }}>
                      <span className="relative flex h-1.5 w-1.5">
                        {div.is_active && (
                          <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ backgroundColor: meta.color }}
                          />
                        )}
                        <span
                          className="relative inline-flex rounded-full h-1.5 w-1.5"
                          style={{ backgroundColor: div.is_active ? meta.color : "#6B6A68" }}
                        />
                      </span>
                      <span className="font-orbitron text-[8px] font-bold tracking-widest text-white/50">
                        {div.is_active ? "ACTIVE" : "UPCOMING"}
                      </span>
                    </div>

                    {/* Card Content Layout */}
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        {/* Game Acronym Display with Drop Glow shadow */}
                        <h3
                          className="font-bebas text-5xl sm:text-6xl font-black uppercase leading-none tracking-wide text-white transition-colors duration-300"
                          style={{
                            textShadow: div.is_active
                              ? `0 0 30px ${meta.color}35`
                              : "none",
                          }}
                        >
                          {meta.abbr}
                        </h3>

                        {/* Division Full Name */}
                        <p className="mt-1 font-orbitron text-[9px] font-bold uppercase tracking-[0.20em] text-white/40 group-hover:text-white/60 transition-colors duration-300">
                          {div.name}
                        </p>

                        {/* Team Name Badge */}
                        {div.org && (
                          <div className="mt-2 inline-block rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[8px] font-bold tracking-widest text-[#F5C400] uppercase font-orbitron">
                            {div.org.name}
                          </div>
                        )}

                        {/* Description */}
                        <p className="mt-4 text-sm leading-relaxed text-white/65 font-medium line-clamp-3">
                          {div.description ?? "Divisi kompetitif aktif di turnamen nasional & regional."}
                        </p>
                      </div>

                      {/* Interactive CTA Link */}
                      <div
                        className="mt-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300"
                        style={{ color: div.is_active ? meta.color : "rgba(255,255,255,0.4)" }}
                      >
                        <span className="relative py-0.5">
                          LIHAT TIM
                          <span
                            className="absolute bottom-0 left-0 h-[1.5px] w-0 transition-all duration-300 group-hover:w-full"
                            style={{ backgroundColor: div.is_active ? meta.color : "rgba(255,255,255,0.4)" }}
                          />
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Huge Background Watermark Outline */}
                    <div
                      className="absolute -bottom-6 -right-4 font-bebas text-9xl font-black select-none pointer-events-none transition-all duration-700 ease-out opacity-[0.02] group-hover:opacity-[0.07] group-hover:scale-105 group-hover:-translate-y-1 text-transparent"
                      style={{
                        WebkitTextStroke: `2px ${div.is_active ? meta.color : "#ffffff"}`,
                      }}
                    >
                      {meta.abbr}
                    </div>
                  </Link>
                );
              })}

              {items.length === 0 && (
                <p className="col-span-3 py-20 text-center text-sm text-white/50">
                  Belum ada divisi tersedia.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default DivisionsPage;
