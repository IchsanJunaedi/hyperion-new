import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import Image from "next/image";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { createClient } from "@/lib/supabase/server";

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

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DivisionDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get the standalone division
  const { data: division } = await supabase
    .from("divisions")
    .select("id, name, slug, game, description, is_active")
    .is("organization_id", null)
    .eq("slug", slug)
    .maybeSingle();

  if (!division) notFound();

  const meta = getMeta(division.game ?? "");

  // Get organizations (teams) that have a division with this slug
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url, description")
    .in(
      "id",
      (
        await supabase
          .from("divisions")
          .select("organization_id")
          .eq("slug", slug)
          .not("organization_id", "is", null)
      ).data?.map((d) => d.organization_id).filter(Boolean) ?? [],
    )
    .order("name");

  const teams = orgs ?? [];

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#070707]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* Yellow glow */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px]"
            style={{ background: `radial-gradient(circle at 80% 50%, ${meta.color}0A 0%, transparent 70%)` }}
          />

          <div className="relative mx-auto max-w-7xl">
            <Link
              href="/divisions"
              className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/30 transition hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> All Divisions
            </Link>

            <div className="flex items-end gap-6">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px w-8" style={{ background: meta.color }} />
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.3em]"
                    style={{ color: meta.color }}
                  >
                    Division
                  </span>
                </div>
                <p
                  className="text-7xl font-black uppercase leading-none tracking-tighter sm:text-8xl"
                  style={{ color: meta.color, textShadow: `0 0 60px ${meta.color}30` }}
                >
                  {meta.abbr}
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-white/30">
                  {division.name}
                </p>
                {division.description && (
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/45">
                    {division.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Teams */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center gap-3">
              <Users className="h-4 w-4 text-white/30" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">
                Tim dalam divisi ini
              </h2>
            </div>

            {teams.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-4 border border-white/5 bg-[#0D0D0D] p-5"
                  >
                    {team.logo_url ? (
                      <Image
                        src={team.logo_url}
                        alt={team.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded text-sm font-black"
                        style={{ background: `${meta.color}18`, color: meta.color }}
                      >
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white">{team.name}</p>
                      {team.description && (
                        <p className="mt-0.5 text-xs text-white/35 line-clamp-1">{team.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-white/5 bg-[#0D0D0D] py-20 text-center">
                <p className="text-sm text-white/30">Roster sedang dalam persiapan.</p>
                <p className="mt-2 text-xs text-white/20">Stay tuned — tim akan segera diumumkan.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
