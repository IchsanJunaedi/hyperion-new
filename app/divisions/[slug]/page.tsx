import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, ArrowRight } from "lucide-react";
import Image from "next/image";

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
    dummyImage: string;
  }

  let players: PlayerRoster[] = [];

  if (teams.length > 0) {
    const allOrgIds = teams.map((t) => t.id);

    const { data: membersData, error: mErr } = await admin
      .from("team_members")
      .select("organization_id, role, user_id")
      .in("organization_id", allOrgIds)
      .eq("is_active", true)
      .in("role", ["captain", "member"])
      .limit(100);
    if (mErr) console.error("DivisionDetailPage: team_members fetch:", mErr);

    const userIds = [...new Set((membersData ?? []).map((m) => m.user_id))];
    let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null; username: string | null }>();

    if (userIds.length > 0) {
      const { data: profilesData, error: pErr } = await admin
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", userIds)
        .limit(100);
      if (pErr) console.error("DivisionDetailPage: profiles fetch:", pErr);
      profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
    }

    const DUMMY_PORTRAITS = [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop"
    ];

    players = (membersData ?? []).map((m, index) => {
      const p = profileMap.get(m.user_id);
      return {
        id: m.user_id,
        display_name: p?.display_name ?? p?.username ?? "Player",
        avatar_url: p?.avatar_url ?? null,
        username: p?.username ?? null,
        role: m.role,
        dummyImage: DUMMY_PORTRAITS[index % DUMMY_PORTRAITS.length] as string
      };
    });
  }

  // Fallback to make it 5 players if less than 5
  const fallbackDummies: PlayerRoster[] = [
    { id: "dummy-1", display_name: "Ace", dummyImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop", role: "member", avatar_url: null, username: null },
    { id: "dummy-2", display_name: "Boxi", dummyImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop", role: "member", avatar_url: null, username: null },
    { id: "dummy-3", display_name: "MickE", dummyImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop", role: "member", avatar_url: null, username: null },
    { id: "dummy-4", display_name: "Nisha", dummyImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop", role: "member", avatar_url: null, username: null },
    { id: "dummy-5", display_name: "tOfu", dummyImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop", role: "member", avatar_url: null, username: null }
  ];

  const rosterList = [...players];
  while (rosterList.length < 5) {
    const dummy = fallbackDummies[rosterList.length];
    if (dummy) rosterList.push(dummy);
  }

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
            <div className="flex items-end gap-6">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px w-8" style={{ background: meta.color }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: meta.color }}>
                    Division
                  </span>
                </div>
                <p
                  className="text-7xl font-black uppercase leading-none tracking-tighter sm:text-8xl"
                  style={{ color: meta.color, textShadow: `0 0 60px ${meta.color}30` }}
                >
                  {meta.abbr}
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-white/55">
                  {division.name}
                </p>
                {division.description && (
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65">
                    {division.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Roster Cards (Image 3 layout) */}
        <section className="px-6 py-20 sm:px-10 lg:px-16 border-t border-white/5 bg-[#020202]">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12">
              <div className="mb-2 flex items-center gap-3">
                <div className="h-4 w-0.5" style={{ background: meta.color }} />
                <h2 className="font-orbitron text-[9px] font-bold uppercase tracking-[0.3em] text-white/55">
                  Active Roster
                </h2>
              </div>
              <h3 className="font-bebas text-4xl sm:text-5xl font-black uppercase leading-[0.9] tracking-wide text-white">
                MEET THE PLAYERS
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {rosterList.map((player) => (
                <div
                  key={player.id}
                  className="group relative aspect-[3/4] overflow-hidden border border-white/5 bg-[#030813] transition-all duration-300 hover:border-[#D4FF00]/40 clip-cyber-btn"
                >
                  {/* Portrait photo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={player.dummyImage}
                    alt={player.display_name}
                    className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ease-out scale-100 group-hover:scale-105"
                  />

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/30 to-transparent opacity-90" />

                  {/* Name and Socials info */}
                  <div className="absolute bottom-0 inset-x-0 p-4 flex flex-col items-center justify-end text-center z-10">
                    <h4 className="font-bebas text-2xl sm:text-3xl font-black uppercase tracking-wide text-white group-hover:text-[#D4FF00] transition-colors duration-200">
                      {player.display_name}
                    </h4>
                    <p className="font-orbitron text-[8px] font-bold uppercase tracking-widest text-white/45 mb-3">
                      {player.role.toUpperCase()}
                    </p>
                    
                    {/* Social links row */}
                    <div className="flex items-center gap-3">
                      <a href="https://twitch.tv" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors duration-200" aria-label="Twitch">
                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0H6zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714v9.429z" />
                        </svg>
                      </a>
                      <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors duration-200" aria-label="YouTube">
                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.52 3.545 12 3.545 12 3.545s-7.52 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.868.508 9.388.508 9.388.508s7.52 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </a>
                      <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors duration-200" aria-label="X (Twitter)">
                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors duration-200" aria-label="Instagram">
                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
