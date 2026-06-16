import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { createAdminClient } from "@/lib/supabase/admin";
import { PlayerRosterCard } from "../PlayerRosterCard";

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

const PLACEMENT_LABEL: Record<number, string> = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };
const PLACEMENT_COLOR: Record<number, string> = {
  1: "#F5C400",
  2: "#9B9A97",
  3: "#CD7F32",
};

interface Props {
  params: Promise<{ slug: string; "org-slug": string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { "org-slug": orgSlug } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("name")
    .eq("slug", orgSlug)
    .maybeSingle();
  const name = data?.name ?? orgSlug;
  return {
    title: `${name} — Hyperion Team`,
    description: `Roster dan prestasi tim ${name}.`,
  };
}

const TeamDetailPage = async ({ params }: Props) => {
  const { slug: divisionSlug, "org-slug": orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name, slug, logo_url, description")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgErr) console.error("TeamDetailPage: org fetch:", orgErr);
  if (!org) notFound();

  // Fetch the division details for this organization to get the game and division name
  const { data: division, error: divErr } = await admin
    .from("divisions")
    .select("id, name, slug, game, description")
    .eq("slug", divisionSlug)
    .eq("organization_id", org.id)
    .maybeSingle();
  if (divErr) console.error("TeamDetailPage: division fetch:", divErr);
  if (!division) notFound();

  const meta = getMeta(division.game ?? "");

  const { data: membersData, error: mErr } = await admin
    .from("team_members")
    .select("user_id, role, jersey_number, position, main_role")
    .eq("organization_id", org.id)
    .eq("division_id", division.id)
    .eq("is_active", true)
    .eq("is_public", true)
    .in("role", ["coach", "captain", "member"])
    .limit(30);
  if (mErr) console.error("TeamDetailPage: members fetch:", mErr);

  const userIds = (membersData ?? []).map((m) => m.user_id);
  let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null; username: string | null; social_links: unknown }>();

  if (userIds.length > 0) {
    const { data: profilesData, error: pErr } = await admin
      .from("profiles")
      .select("id, display_name, avatar_url, username, social_links")
      .in("id", userIds)
      .limit(30);
    if (pErr) console.error("TeamDetailPage: profiles fetch:", pErr);
    profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
  }

  const { data: achievements, error: aErr } = await admin
    .from("gallery_entries")
    .select("id, title, placement, achieved_at:tournament_date")
    .eq("organization_id", org.id)
    .order("tournament_date", { ascending: false })
    .limit(20);
  if (aErr) console.error("TeamDetailPage: achievements fetch:", aErr);

  const ROLE_ORDER: Record<string, number> = { coach: 0, captain: 1, member: 2 };
  const membersDataSorted = [...(membersData ?? [])].sort(
    (a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
  );

  const players = membersDataSorted.map((m) => {
    const p = profileMap.get(m.user_id);
    const socials = (p?.social_links ?? {}) as { instagram?: string; tiktok?: string };
    return {
      id: m.user_id,
      display_name: p?.display_name ?? p?.username ?? "Player",
      avatar_url: p?.avatar_url ?? null,
      username: p?.username ?? null,
      role: m.role,
      instagram: socials.instagram?.trim() || null,
      orgName: org.name,
    };
  });

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
                    Division — {org.name}
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
                  {org.description || division.description || "Divisi utama yang mewakili tim di kancah profesional esports nasional."}
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

        {/* Roster Cards */}
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

            {players.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {players.map((player) => (
                  <PlayerRosterCard key={player.id} player={player} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/45">Roster belum tersedia.</p>
            )}
          </div>
        </section>

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <section className="px-6 pb-20 sm:px-10 lg:px-16 bg-[#040D1C]">
            <div className="mx-auto max-w-7xl border-t border-white/5 pt-12">
              <div className="mb-6 flex items-center gap-3">
                <Trophy className="h-4 w-4 text-white/45" />
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/45">
                  Prestasi Tim
                </h2>
              </div>
              <div className="space-y-2">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 border border-white/12 bg-[#071428] px-5 py-4"
                  >
                    {a.placement != null && (
                      <span
                        className="shrink-0 text-lg font-black"
                        style={{ color: PLACEMENT_COLOR[a.placement] ?? "#9B9A97" }}
                      >
                        #{a.placement}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{a.title}</p>
                    </div>
                    {a.placement != null && (
                      <span
                        className="shrink-0 text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: PLACEMENT_COLOR[a.placement] ?? "#9B9A97" }}
                      >
                        {PLACEMENT_LABEL[a.placement] ?? `Juara ${a.placement}`}
                      </span>
                    )}
                    <span className="shrink-0 text-[10px] text-white/40">
                      {a.achieved_at?.slice(0, 4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
};

export default TeamDetailPage;
