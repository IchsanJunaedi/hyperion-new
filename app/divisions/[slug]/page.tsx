import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Instagram } from "lucide-react";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { createAdminClient } from "@/lib/supabase/admin";

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

export const dynamic = "force-dynamic";

export default async function DivisionDetailPage({ params }: Props) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: divisionRows, error: divErr } = await admin
    .from("divisions")
    .select("id, name, slug, game, description, is_active")
    .eq("slug", slug)
    .eq("is_public", true)
    .limit(1);
  if (divErr) console.error("DivisionDetailPage division:", divErr);

  const division = divisionRows?.[0];
  if (!division) notFound();

  const meta = getMeta(division.game ?? "");

  // Only orgs whose division row is public should surface on the public site.
  const subQuery = await admin
    .from("divisions")
    .select("organization_id")
    .eq("slug", slug)
    .eq("is_public", true)
    .not("organization_id", "is", null)
    .limit(50);
  if (subQuery.error) console.error("DivisionDetailPage orgs:", subQuery.error);

  const orgIds = (subQuery.data ?? []).map((d) => d.organization_id).filter(Boolean) as string[];

  let teams: { id: string; name: string; slug: string; logo_url: string | null; description: string | null }[] = [];
  if (orgIds.length > 0) {
    const { data } = await admin
      .from("organizations")
      .select("id, name, slug, logo_url, description")
      .in("id", orgIds)
      .order("name")
      .limit(50);
    teams = data ?? [];
  }

  // Batch-fetch players for all teams in the division
  interface PlayerRoster {
    id: string;
    display_name: string;
    avatar_url: string | null;
    username: string | null;
    role: string;
    instagram: string | null;
  }

  let players: PlayerRoster[] = [];

  if (teams.length > 0) {
    const allOrgIds = teams.map((t) => t.id);

    const { data: membersData, error: mErr } = await admin
      .from("team_members")
      .select("organization_id, role, user_id")
      .in("organization_id", allOrgIds)
      .eq("is_active", true)
      .eq("is_public", true)
      .in("role", ["captain", "member"])
      .limit(100);
    if (mErr) console.error("DivisionDetailPage: team_members fetch:", mErr);

    const userIds = [...new Set((membersData ?? []).map((m) => m.user_id))];
    let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null; username: string | null; social_links: unknown }>();

    if (userIds.length > 0) {
      const { data: profilesData, error: pErr } = await admin
        .from("profiles")
        .select("id, display_name, avatar_url, username, social_links")
        .in("id", userIds)
        .limit(100);
      if (pErr) console.error("DivisionDetailPage: profiles fetch:", pErr);
      profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
    }

    players = (membersData ?? []).map((m) => {
      const p = profileMap.get(m.user_id);
      const socials = (p?.social_links ?? {}) as { instagram?: string; tiktok?: string };
      return {
        id: m.user_id,
        display_name: p?.display_name ?? p?.username ?? "Player",
        avatar_url: p?.avatar_url ?? null,
        username: p?.username ?? null,
        role: m.role,
        instagram: socials.instagram?.trim() || null,
      };
    });
  }

  const rosterList = players;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px]"
            style={{ background: `radial-gradient(circle at 80% 50%, ${meta.color}0A 0%, transparent 70%)` }}
          />
          <div className="relative mx-auto max-w-7xl">
            <Link
              href="/divisions"
              className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50 transition hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> All Divisions
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: meta.color }}>
                    Division
                  </span>
                </div>
                <h1
                  className="font-bebas text-8xl sm:text-9xl font-black uppercase leading-none tracking-wide text-white"
                  style={{ color: meta.color, textShadow: `0 0 60px ${meta.color}25` }}
                >
                  {meta.abbr}
                </h1>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-white/55">
                  {division.name}
                </p>
                <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-[#9B9A97] font-light">
                  {division.description ?? "Divisi utama yang mewakili tim di kancah profesional esports nasional."}
                </p>
              </div>

              {/* Faded Watermark on the right */}
              <div
                className="hidden md:block font-bebas text-[9rem] lg:text-[11rem] font-black leading-none select-none pointer-events-none opacity-[0.02] text-transparent shrink-0"
                style={{ WebkitTextStroke: `2px ${meta.color}` }}
              >
                {meta.abbr}
              </div>
            </div>
          </div>
        </section>

        {/* Roster Cards (Image 3 layout) */}
        <section className="px-6 py-20 sm:px-10 lg:px-16 border-t border-white/5 bg-[#040D1C]">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12">
              <div className="mb-2 flex items-center gap-3">
                <h2 className="font-orbitron text-[9px] font-bold uppercase tracking-[0.3em] text-[#9B9A97]">
                  Active Roster
                </h2>
              </div>
              <h3 className="font-bebas text-4xl sm:text-5xl font-black uppercase leading-[0.9] tracking-wide text-white">
                MEET THE PLAYERS
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {rosterList.map((player) => {
                const cardClass = "group relative aspect-[3/4] overflow-hidden bg-[#030813] transition-all duration-300 clip-cyber-btn border-none";
                const content = (
                  <>
                    {/* Portrait photo */}
                    {player.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.avatar_url}
                        alt={player.display_name}
                        className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ease-out scale-100 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ background: "linear-gradient(135deg, #0d1b2e 0%, #1a2a40 50%, #0a1520 100%)" }}
                      />
                    )}

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030914] via-[#030914]/30 to-transparent opacity-90" />

                    {/* Name and role */}
                    <div className="absolute bottom-0 inset-x-0 p-4 flex flex-col items-center justify-end text-center z-10">
                      <h4 className="font-bebas text-2xl sm:text-3xl font-black uppercase tracking-wide text-white group-hover:text-[#F5C400] transition-colors duration-200">
                        {player.display_name}
                      </h4>
                      <p className="font-orbitron text-[8px] font-bold uppercase tracking-widest text-white/45 mb-2">
                        {player.role.toUpperCase()}
                      </p>

                      {/* Instagram — button avoids nested <a> inside <Link> */}
                      {player.instagram && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(
                              `https://instagram.com/${player.instagram!.replace(/^@/, "")}`,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }}
                          className="cursor-pointer text-gray-400 hover:text-white transition-colors duration-300"
                          aria-label="Instagram"
                        >
                          <Instagram className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </>
                );

                return player.username ? (
                  <Link
                    key={player.id}
                    href={`/players/${player.username}`}
                    className={cardClass}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={player.id} className={cardClass}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
