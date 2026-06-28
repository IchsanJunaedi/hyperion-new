import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import Image from "next/image";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABEL: Record<string, string> = {
  captain: "Captain",
  coach: "Coach",
  member: "Member",
  manager: "Manager",
  owner: "Owner",
};

const PLACEMENT_COLOR: Record<number, string> = {
  1: "#F5C400",
  2: "#9B9A97",
  3: "#CD7F32",
};

const PLACEMENT_LABEL: Record<number, string> = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };

interface Props {
  params: Promise<{ username: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("username", username)
    .maybeSingle();
  const name = data?.display_name ?? data?.username ?? username;
  return {
    title: `${name} — Hyperion Team`,
    description: `Profil publik ${name} di Hyperion Team.`,
  };
}

export default async function PlayerProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .eq("username", username)
    .maybeSingle();
  if (pErr) console.error("PlayerProfilePage: profile fetch:", pErr);
  if (!profile) notFound();

  const { data: memberships, error: mErr } = await supabase
    .from("team_members")
    .select("organization_id, role")
    .eq("user_id", profile.id)
    .eq("is_active", true)
    .limit(5);
  if (mErr) console.error("PlayerProfilePage: memberships fetch:", mErr);

  const orgIds = (memberships ?? []).map((m) => m.organization_id);

  let orgMap = new Map<string, { name: string; slug: string }>();
  if (orgIds.length > 0) {
    const { data: orgs, error: oErr } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .in("id", orgIds)
      .limit(5);
    if (oErr) console.error("PlayerProfilePage: orgs fetch:", oErr);
    orgMap = new Map((orgs ?? []).map((o) => [o.id, { name: o.name, slug: o.slug }]));
  }

  type AchievementRow = { id: string; title: string; placement: number | null; achieved_at: string | null; organization_id: string };
  let achievements: AchievementRow[] = [];
  if (orgIds.length > 0) {
    const { data, error: aErr } = await supabase
      .from("gallery_entries")
      .select("id, title, placement, achieved_at:tournament_date, organization_id")
      .in("organization_id", orgIds)
      .order("tournament_date", { ascending: false })
      .limit(30);
    if (aErr) console.error("PlayerProfilePage: achievements fetch:", aErr);
    achievements = (data ?? []) as AchievementRow[];
  }

  const currentTeam = (memberships ?? [])[0];
  const currentOrg = currentTeam ? orgMap.get(currentTeam.organization_id) : null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {/* Profile header */}
        <section className="relative overflow-hidden border-b border-white/12 px-6 py-16 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-8"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.12) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-4xl">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/30 transition hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> Beranda
            </Link>

            <div className="flex items-center gap-6">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name ?? profile.username ?? ""}
                  width={80}
                  height={80}
                  className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-[#F5C400]/40"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0C1E3C] text-2xl font-black text-white/50 ring-2 ring-[#F5C400]/30">
                  {(profile.display_name ?? profile.username ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  {profile.display_name ?? profile.username}
                </h1>
                <p className="mt-0.5 text-sm text-white/55">@{profile.username}</p>
                {currentOrg && currentTeam && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-white/45">Tim aktif:</span>
                    <span className="text-xs font-semibold text-white/75">{currentOrg.name}</span>
                    <span className="rounded bg-[#0C1E3C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                      {ROLE_LABEL[currentTeam.role] ?? currentTeam.role}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="px-6 py-14 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <Trophy className="h-4 w-4 text-white/50" />
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">
                Prestasi
              </h2>
            </div>

            {achievements.length > 0 ? (
              <div className="space-y-2">
                {achievements.map((a) => {
                  const org = orgMap.get(a.organization_id);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 border border-white/12 bg-[#071428] px-5 py-4"
                    >
                      {a.placement != null && (
                        <span
                          className="w-6 shrink-0 text-center text-lg font-black"
                          style={{ color: PLACEMENT_COLOR[a.placement] ?? "#9B9A97" }}
                        >
                          #{a.placement}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{a.title}</p>
                        {org && (
                          <p className="mt-0.5 text-[10px] text-white/50">{org.name}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {a.placement != null && (
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: PLACEMENT_COLOR[a.placement] ?? "#9B9A97" }}
                          >
                            {PLACEMENT_LABEL[a.placement] ?? `Juara ${a.placement}`}
                          </span>
                        )}
                        <span className="text-[10px] text-white/40">
                          {a.achieved_at?.slice(0, 4)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-white/12 bg-[#071428] py-14 text-center">
                <Trophy className="mx-auto mb-3 h-6 w-6 text-white/20" />
                <p className="text-sm text-white/45">Belum ada prestasi tercatat.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
