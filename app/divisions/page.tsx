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

export default async function DivisionsPage() {
  const admin = createAdminClient();

  const { data: divisions, error } = await admin
    .from("divisions")
    .select("id, name, slug, game, description, is_active")
    .eq("is_public", true)
    .order("name")
    .limit(50);
  if (error) console.error("DivisionsPage:", error);

  // Dedupe by slug — multiple orgs can share the same game/slug.
  const seen = new Set<string>();
  const items = (divisions ?? []).filter((d) => {
    if (seen.has(d.slug)) return false;
    seen.add(d.slug);
    return true;
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
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                Game Divisions
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              DIVISIONS
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
              Hyperion Team berlaga di berbagai game kompetitif. Pilih divisi untuk melihat roster tim.
            </p>
          </div>
        </section>

        {/* Division cards */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((div) => {
                const meta = getMeta(div.game ?? "");
                return (
                  <Link
                    key={div.id}
                    href={`/divisions/${div.slug}`}
                    className="group relative overflow-hidden border border-white/12 bg-[#071428] transition-all hover:border-[#F5C400]/30"
                    style={div.is_active ? { borderColor: `${meta.color}22` } : {}}
                  >
                    <div className="h-1 w-full" style={{ background: div.is_active ? meta.color : "rgba(255,255,255,0.06)" }} />
                    <div className="p-8">
                      <p
                        className="text-6xl font-black uppercase leading-none tracking-tighter"
                        style={{ color: div.is_active ? meta.color : "rgba(255,255,255,0.1)" }}
                      >
                        {meta.abbr}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                        {div.name}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-white/65">
                        {div.description ?? "Divisi kompetitif aktif di turnamen nasional & regional."}
                      </p>
                      <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all group-hover:gap-3"
                        style={{ color: div.is_active ? meta.color : "rgba(255,255,255,0.2)" }}>
                        Lihat Tim <ArrowRight className="h-3 w-3" />
                      </div>
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
