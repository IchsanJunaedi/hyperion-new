import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import Image from "next/image";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLE_LABEL: Record<string, string> = {
  captain: "Captain",
  coach: "Coach",
  member: "Member",
};

const ROLE_COLOR: Record<string, string> = {
  captain: "#A855F7",
  coach: "#3B82F6",
  member: "#9B9A97",
};

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

export default async function TeamDetailPage({ params }: Props) {
  const { slug: divisionSlug, "org-slug": orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name, slug, logo_url, description")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgErr) console.error("TeamDetailPage: org fetch:", orgErr);
  if (!org) notFound();

  const { data: membersData, error: mErr } = await admin
    .from("team_members")
    .select("user_id, role, jersey_number, position, main_role")
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .in("role", ["coach", "captain", "member"])
    .limit(30);
  if (mErr) console.error("TeamDetailPage: members fetch:", mErr);

  const userIds = (membersData ?? []).map((m) => m.user_id);
  let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null; username: string | null }>();

  if (userIds.length > 0) {
    const { data: profilesData, error: pErr } = await admin
      .from("profiles")
      .select("id, display_name, avatar_url, username")
      .in("id", userIds)
      .limit(30);
    if (pErr) console.error("TeamDetailPage: profiles fetch:", pErr);
    profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
  }

  const { data: achievements, error: aErr } = await admin
    .from("achievements")
    .select("id, title, placement, achieved_at")
    .eq("organization_id", org.id)
    .order("achieved_at", { ascending: false })
    .limit(20);
  if (aErr) console.error("TeamDetailPage: achievements fetch:", aErr);

  const ROLE_ORDER: Record<string, number> = { coach: 0, captain: 1, member: 2 };
  const members = (membersData ?? [])
    .map((m) => ({ ...m, profile: profileMap.get(m.user_id) }))
    .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/12 px-6 py-16 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-8"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.15) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <Link
              href={`/divisions/${divisionSlug}`}
              className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/45 transition hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> Kembali ke Divisi
            </Link>

            <div className="flex items-center gap-6">
              {org.logo_url ? (
                <Image
                  src={org.logo_url}
                  alt={org.name}
                  width={72}
                  height={72}
                  className="h-18 w-18 rounded-lg object-cover ring-2 ring-[#F5C400]/30"
                />
              ) : (
                <div className="flex h-18 w-18 items-center justify-center rounded-lg bg-[#0C1E3C] text-xl font-black text-white/40 ring-2 ring-white/10">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                  {org.name}
                </h1>
                {org.description && (
                  <p className="mt-1.5 max-w-lg text-sm text-white/55">{org.description}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Roster — Team Liquid style photo cards */}
        <section className="px-6 py-14 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-8 text-xs font-bold uppercase tracking-[0.3em] text-white/45">
              Roster
            </h2>

            {members.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {members.map((m) => {
                  const name = m.profile?.display_name ?? m.profile?.username ?? "—";
                  const href = m.profile?.username ? `/players/${m.profile.username}` : "#";
                  const roleColor = ROLE_COLOR[m.role] ?? "#9B9A97";

                  return (
                    <Link
                      key={m.user_id}
                      href={href}
                      className="group flex flex-col overflow-hidden border border-white/10 bg-[#071428] transition-all duration-200 hover:border-[#F5C400]/40 hover:bg-[#0C1E3C]"
                    >
                      {/* Photo area — portrait aspect ratio */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0C1E3C]">
                        {m.profile?.avatar_url ? (
                          <Image
                            src={m.profile.avatar_url}
                            alt={name}
                            fill
                            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-5xl font-black text-white/15">
                              {name.slice(0, 1).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {/* Bottom gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#040D1C]/80 via-transparent to-transparent" />
                        {/* Role badge top-right */}
                        <div
                          className="absolute right-2 top-2 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                          style={{ background: `${roleColor}22`, color: roleColor, border: `1px solid ${roleColor}40` }}
                        >
                          {ROLE_LABEL[m.role] ?? m.role}
                        </div>
                      </div>

                      {/* Info below photo */}
                      <div className="p-3">
                        <p className="truncate font-black uppercase tracking-tight text-white sm:text-sm">
                          {name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {m.position && (
                            <span className="truncate text-[10px] text-white/45">{m.position}</span>
                          )}
                          {m.jersey_number != null && (
                            <span className="shrink-0 text-[10px] text-white/30">#{m.jersey_number}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-white/45">Roster belum tersedia.</p>
            )}
          </div>
        </section>

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <section className="px-6 pb-14 sm:px-10 lg:px-16">
            <div className="mx-auto max-w-7xl">
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
}
