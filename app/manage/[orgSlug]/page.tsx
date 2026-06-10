import { UserPlus } from "lucide-react";
import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { ManageMemberTable } from "@/features/dashboard/components/ManageMemberTable";
import { InviteSection } from "@/features/manage/components/InviteSection";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageTeamPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) return null;

  const [membersRes, divsRes, invitesRes, totalRes] = await Promise.all([
    admin
      .from("team_members")
      .select("id, user_id, organization_id, division_id, role, is_active, availability, main_role")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("role", { ascending: true })
      .limit(100),
    admin
      .from("divisions")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
    admin
      .from("organization_invites")
      .select("id, organization_id, division_id, role, expires_at, created_at")
      .eq("organization_id", org.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const members = membersRes.data ?? [];
  const divisions = divsRes.data ?? [];
  const invites = invitesRes.data ?? [];

  const memberUserIds = [...new Set(members.map((m) => m.user_id))];
  const { data: profiles } = memberUserIds.length > 0
    ? await admin
        .from("profiles")
        .select("id, full_name, username, display_name, phone_wa, date_of_birth, bio, social_links, game_ids")
        .in("id", memberUserIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const divisionMap = new Map(divisions.map((d) => [d.id, d]));

  const ROLE_ORDER: Record<string, number> = {
    owner: 0, manager: 1, coach: 2, captain: 3, member: 4,
  };

  const sortedMembers = [...members].sort((a, b) => {
    const roleA = ROLE_ORDER[a.role] ?? 99;
    const roleB = ROLE_ORDER[b.role] ?? 99;
    if (roleA !== roleB) return roleA - roleB;
    const pA = profileMap.get(a.user_id);
    const pB = profileMap.get(b.user_id);
    const nameA = (pA?.full_name ?? pA?.display_name ?? "").toLowerCase();
    const nameB = (pB?.full_name ?? pB?.display_name ?? "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-ui-text">Manager Panel</h1>
        <p className="mt-1 text-sm text-white/60">
          Kelola roster tim, assign Captain dan Member, lihat statistik.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Member" value={members.length} />
        <StatCard label="Divisi Aktif" value={divisions.length} />
        <StatCard label="User Terdaftar" value={totalRes.count ?? 0} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/manage/${orgSlug}/assign`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Member
        </Link>
        <Link
          href={`/manage/${orgSlug}/divisions`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-ui-text transition hover:bg-white/10"
        >
          Edit Divisi
        </Link>
        <Link
          href={`/manage/${orgSlug}/captains`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-ui-text transition hover:bg-white/10"
        >
          Edit Captain
        </Link>
      </div>

      <InviteSection
        orgId={org.id}
        orgSlug={org.slug}
        divisions={divisions}
        pendingInvites={invites.map((inv) => ({
          id: inv.id,
          role: inv.role,
          division: inv.division_id
            ? divisions.find((d) => d.id === inv.division_id)?.name ?? null
            : null,
          expiresAt: inv.expires_at,
          createdAt: inv.created_at,
        }))}
      />

      <ManageMemberTable
        orgName={org.name}
        members={sortedMembers.map((m) => {
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
            orgSlug: org.slug,
            availability: m.availability ?? "active",
            mainRole: (m as { main_role?: string | null }).main_role ?? null,
          };
        })}
      />
    </div>
  );
};
export default ManageTeamPage;

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ui-text">{value}</p>
    </div>
  );
}
