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

  // Batch-fetch players for all teams (max 3 per team shown as preview)
  type PlayerPreview = { role: string; display_name: string | null; avatar_url: string | null; username: string | null };
  const membersByOrg = new Map<string, PlayerPreview[]>();

  if (teams.length > 0) {
    const allOrgIds = teams.map((t) => t.id);

    const { data: membersData, error: mErr } = await admin
      .from("team_members")
      .select("organization_id, role, user_id")
      .in("organization_id", allOrgIds)
      .eq("is_active", true)
      .limit(200);
    if (mErr) console.error("DivisionDetailPage: team_members fetch:", mErr);

    const userIds = [...new Set((membersData ?? []).map((m) => m.user_id))];
    let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null; username: string | null }>();

    if (userIds.length > 0) {
      const { data: profilesData, error: pErr } = await admin
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", userIds)
        .limit(200);
      if (pErr) console.error("DivisionDetailPage: profiles fetch:", pErr);
      profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
    }

    const roleOrder: Record<string, number> = { captain: 0, coach: 1, member: 2, manager: 3 };
    const sorted = [...(membersData ?? [])].sort(
      (a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9),
    );

    for (const m of sorted) {
      const list = membersByOrg.get(m.organization_id) ?? [];
      if (list.length < 3) {
        const p = profileMap.get(m.user_id);
        list.push({
          role: m.role,
          display_name: p?.display_name ?? null,
          avatar_url: p?.avatar_url ?? null,
          username: p?.username ?? null,
        });
        membersByOrg.set(m.organization_id, list);
      }
    }
  }

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
                {teams.map((team) => {
                  const players = membersByOrg.get(team.id) ?? [];
                  return (
                    <Link
                      key={team.id}
                      href={`/divisions/${slug}/${team.slug}`}
                      className="group flex flex-col gap-4 border border-white/5 bg-[#0D0D0D] p-5 transition hover:border-white/10"
                    >
                      {/* Team header */}
                      <div className="flex items-center gap-4">
                        {team.logo_url ? (
                          <Image
                            src={team.logo_url}
                            alt={team.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded text-sm font-black"
                            style={{ background: `${meta.color}18`, color: meta.color }}
                          >
                            {team.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-white">{team.name}</p>
                          {team.description && (
                            <p className="mt-0.5 truncate text-xs text-white/35">{team.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Player preview */}
                      {players.length > 0 && (
                        <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
                          {players.map((p, i) => (
                            <div key={i} className="flex items-center gap-2">
                              {p.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.avatar_url}
                                  alt=""
                                  className="h-5 w-5 shrink-0 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-[8px] font-bold text-white/50">
                                  {(p.display_name ?? "?").slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <span className="truncate text-xs text-white/60">
                                {p.display_name ?? p.username ?? "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div
                        className="mt-auto flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all group-hover:gap-2"
                        style={{ color: meta.color }}
                      >
                        Lihat Tim <ArrowRight className="h-3 w-3" />
                      </div>
                    </Link>
                  );
                })}
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
