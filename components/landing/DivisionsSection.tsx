import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

const GAME_META: Record<string, { color: string; abbr: string }> = {
  "mobile legends": { color: "#F5C400", abbr: "MLBB" },
  "mobile_legends": { color: "#F5C400", abbr: "MLBB" },
  "pubg":           { color: "#F97316", abbr: "PUBG" },
  "pubg mobile":    { color: "#F97316", abbr: "PUBGM" },
  "free fire":      { color: "#22C55E", abbr: "FF" },
};

function getMeta(game: string) {
  const key = game.toLowerCase();
  return GAME_META[key] ?? { color: "#9B9A97", abbr: game.slice(0, 4).toUpperCase() };
}

export async function DivisionsSection() {
  const supabase = await createClient();

  // Standalone divisions (organization_id IS NULL) = game divisions for landing page
  const { data: divisions } = await supabase
    .from("divisions")
    .select("id, name, slug, game, description, logo_url, is_active")
    .is("organization_id", null)
    .eq("is_active", true)
    .order("name");

  const items = divisions ?? [];
  if (items.length === 0) return null;

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

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((div) => {
            const meta = getMeta(div.game ?? "");
            const isFirst = items.indexOf(div) === 0;
            return (
              <div
                key={div.id}
                className="group relative overflow-hidden border border-white/5 bg-[#0D0D0D] transition-all duration-300 hover:border-white/10"
                style={isFirst ? { borderColor: `${meta.color}33` } : {}}
              >
                {/* Top accent bar */}
                <div
                  className="h-1 w-full"
                  style={{ background: isFirst ? meta.color : "rgba(255,255,255,0.06)" }}
                />

                <div className="p-6">
                  {/* Active badge */}
                  <div className="mb-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        background: isFirst ? `${meta.color}18` : "rgba(255,255,255,0.05)",
                        color: isFirst ? meta.color : "rgba(255,255,255,0.3)",
                        border: `1px solid ${isFirst ? `${meta.color}30` : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: isFirst ? meta.color : "rgba(255,255,255,0.2)" }}
                      />
                      ACTIVE
                    </span>
                  </div>

                  {/* Abbr */}
                  <p
                    className="text-5xl font-black uppercase leading-none tracking-tighter"
                    style={{
                      color: isFirst ? meta.color : "rgba(255,255,255,0.1)",
                      textShadow: isFirst ? `0 0 40px ${meta.color}44` : "none",
                    }}
                  >
                    {meta.abbr}
                  </p>

                  {/* Full game name */}
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/30">
                    {div.name}
                  </p>

                  {/* Description */}
                  <p className="mt-4 text-sm leading-relaxed text-white/50">
                    {div.description ??
                      "Divisi kompetitif aktif berlaga di berbagai turnamen nasional dan regional."}
                  </p>

                  {/* CTA */}
                  <div className="mt-6">
                    <Link
                      href={`/divisions/${div.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition hover:gap-3"
                      style={{ color: isFirst ? meta.color : "rgba(255,255,255,0.2)" }}
                    >
                      Lihat Tim <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Corner bracket on first/primary */}
                {isFirst && (
                  <div
                    className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2"
                    style={{ borderColor: `${meta.color}30` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
