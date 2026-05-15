import { UserPlus } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ManageMemberTable } from "@/features/dashboard/components/ManageMemberTable";
import { InviteSection } from "@/features/manage/components/InviteSection";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  // Get the org(s) this manager belongs to
  const { data: memberships } = await admin
    .from("team_members")
    .select("organization_id, role")
    .eq("user_id", user!.id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true);

  const orgIds = [...new Set((memberships ?? []).map((m) => m.organization_id))];

  // Get org details
  const { data: orgs } = orgIds.length > 0
    ? await admin.from("organizations").select("id, name, slug").in("id", orgIds)
    : { data: [] };

  // Get divisions for these orgs
  const { data: divisions } = orgIds.length > 0
    ? await admin.from("divisions").select("id, organization_id, name").in("organization_id", orgIds).eq("is_active", true)
    : { data: [] };

  // Get all members in these orgs
  const { data: members } = orgIds.length > 0
    ? await admin
        .from("team_members")
        .select("id, user_id, organization_id, division_id, role, is_active, availability")
        .in("organization_id", orgIds)
        .eq("is_active", true)
        .order("role", { ascending: true })
    : { data: [] };

  // Get profiles for these members
  const memberUserIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: profiles } = memberUserIds.length > 0
    ? await admin.from("profiles").select("id, full_name, username, display_name, phone_wa, date_of_birth, bio, social_links, game_ids").in("id", memberUserIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const divisionMap = new Map((divisions ?? []).map((d) => [d.id, d]));

  // Get pending invites for manager's orgs
  const { data: pendingInvites } = orgIds.length > 0
    ? await admin
        .from("organization_invites")
        .select("id, organization_id, division_id, role, expires_at, created_at")
        .in("organization_id", orgIds)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
    : { data: [] };

  // Get total registered users
  const { count: totalRegistered } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const ROLE_ORDER: Record<string, number> = { owner: 0, manager: 1, captain: 2, member: 3 };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white">Manager Panel</h1>
        <p className="mt-1 text-sm text-white/60">
          Kelola roster tim, assign Captain dan Member, lihat statistik.
        </p>
      </header>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Tim Dikelola" value={orgs?.length ?? 0} />
          <StatCard label="Member Aktif" value={members?.length ?? 0} />
          <StatCard label="User Terdaftar" value={totalRegistered ?? 0} />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/manage/assign"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Member
          </Link>
          <Link
            href="/manage/divisions"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Edit Divisi
          </Link>
          <Link
            href="/manage/captains"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Edit Captain
          </Link>
        </div>

        {/* Members per org */}
        {(orgs ?? []).map((org) => {
          const orgMembers = (members ?? [])
            .filter((m) => m.organization_id === org.id)
            .sort((a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99));
          const orgDivisions = (divisions ?? [])
            .filter((d) => d.organization_id === org.id)
            .map((d) => ({ id: d.id, name: d.name }));
          return (
            <section key={org.id} className="space-y-4">
              <h2 className="text-sm font-semibold text-white">
                {org.name}{" "}
                <span className="text-white/40">({orgMembers.length} member)</span>
              </h2>
              <InviteSection
                orgId={org.id}
                orgSlug={org.slug}
                divisions={orgDivisions}
                pendingInvites={(pendingInvites ?? [])
                  .filter((inv) => inv.organization_id === org.id)
                  .map((inv) => ({
                    id: inv.id,
                    role: inv.role,
                    division: inv.division_id
                      ? (divisions ?? []).find((d) => d.id === inv.division_id)?.name ?? null
                      : null,
                    expiresAt: inv.expires_at,
                    createdAt: inv.created_at,
                  }))}
              />
              <ManageMemberTable
                orgName={org.name}
                members={orgMembers.map((m) => {
                  const p = profileMap.get(m.user_id);
                  const div = m.division_id ? divisionMap.get(m.division_id) : null;
                  return {
                    id: m.id,
                    userId: m.user_id,
                    fullName: p?.full_name ?? p?.display_name ?? null,
                    username: p?.username ?? null,
                    email: null,
                    phoneWa: p?.phone_wa ?? null,
                    dateOfBirth: (p as { date_of_birth?: string } | undefined)?.date_of_birth ?? null,
                    bio: (p as { bio?: string } | undefined)?.bio ?? null,
                    socialLinks: (p as { social_links?: Record<string, string> } | undefined)?.social_links ?? null,
                    gameIds: (p as { game_ids?: Record<string, string> } | undefined)?.game_ids ?? null,
                    role: m.role,
                    division: div?.name ?? null,
                    orgName: org.name,
                    availability: m.availability ?? "active",
                  };
                })}
              />
            </section>
          );
        })}

        {(!orgs || orgs.length === 0) && (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40">
            Kamu belum di-assign ke tim manapun. Hubungi Owner.
          </div>
        )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

