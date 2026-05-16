import Link from "next/link";
import { Crown, Plus, Users, Tags, Settings, FileOutput, Shield, Building2, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardLoginForm } from "@/features/dashboard/components/DashboardLoginForm";
import { CreateTeamForm } from "@/features/dashboard/components/CreateTeamForm";
import { HomeSection } from "@/features/dashboard/components/HomeSection";
import { HomeOrgSection } from "@/features/dashboard/components/HomeOrgSection";
import { ManagerTimDivisiTable } from "@/features/dashboard/components/ManagerTimDivisiTable";
import { TeamHealthScore } from "@/features/dashboard/components/TeamHealthScore";
import { getTeamHealthScore } from "@/features/dashboard/queries/healthScore";
import type { UserDetail } from "@/features/dashboard/components/UserDetailModal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 bg-[#191919]">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <Crown className="h-12 w-12 mx-auto text-[#9B9A97] mb-4" />
            <h1 className="text-2xl font-bold text-[#E5E2E1]">Master Dashboard</h1>
            <p className="mt-1 text-sm text-[#9B9A97]">Login untuk mengakses panel admin.</p>
          </div>
          <DashboardLoginForm />
        </div>
      </main>
    );
  }

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 bg-[#191919]">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#E5E2E1]">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-[#9B9A97]">Halaman ini hanya untuk Owner.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-[#9B9A97] hover:text-[#D4D4D4]">← Kembali</Link>
        </div>
      </main>
    );
  }

  const admin = createAdminClient();

  // Queries
  const { count: totalUsers } = await admin.from("profiles").select("id", { count: "exact", head: true });
  const { data: orgs } = await admin.from("organizations").select("id, name, slug").order("created_at", { ascending: false });
  const { data: members } = await admin.from("team_members").select("id, user_id, organization_id, division_id, role, is_active").eq("is_active", true);
  const { data: allDivisions } = await admin.from("divisions").select("id, name, organization_id");
  const { data: profiles } = await admin.from("profiles").select("id, full_name, username, display_name, phone_wa, avatar_url").order("created_at", { ascending: false });
  const workspaceName = profiles?.find(p => p.id === user.id)?.full_name ?? "Hyperion Team";

  // Emails
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 100 });
  const emailMap = new Map<string, string>();
  for (const u of authUsers?.users ?? []) { if (u.email) emailMap.set(u.id, u.email); }

  // Role map
  const roleMap = new Map<string, string>();
  const rolePriority: Record<string, number> = { owner: 0, manager: 1, coach: 2, captain: 3, member: 4 };
  for (const m of members ?? []) {
    const existing = roleMap.get(m.user_id);
    if (!existing || (rolePriority[m.role] ?? 99) < (rolePriority[existing] ?? 99)) roleMap.set(m.user_id, m.role);
  }
  for (const [uid, email] of emailMap.entries()) { if (email === ownerEmail) roleMap.set(uid, "owner"); }

  // Team health score for first org
  const healthOrgId = orgs?.[0]?.id ?? null;
  let healthScore = null;
  if (healthOrgId) {
    try {
      healthScore = await getTeamHealthScore(healthOrgId);
    } catch (e) {
      console.error("Failed to fetch health score:", e);
    }
  }

  // Managers
  const managers = (members ?? []).filter((m) => m.role === "manager" && m.is_active).slice(0, 7);

  return (
    <>
      <header className="h-12 flex items-center px-6 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
          <span>{workspaceName}</span>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">Home</span>
        </div>
      </header>

      <main className="flex-1 max-w-[900px] w-full mx-auto px-8 py-12 flex flex-col gap-10">
        {/* Title + Stats */}
        <div>
          <Crown className="h-8 w-8 text-[#9B9A97] mb-3" />
          <h1 className="font-bold text-[36px] leading-tight text-[#E5E2E1]">Home</h1>
          <p className="text-[#9B9A97] mt-1 mb-6">Workspace owner overview and controls.</p>
          <div className="flex flex-wrap gap-x-12 gap-y-4 border-b border-[#2D2D2D] pb-6">
            <Stat label="Total User" value={totalUsers ?? 0} />
            <Stat label="Total Tim" value={orgs?.length ?? 0} />
            <Stat label="Member Aktif" value={members?.length ?? 0} />
            <Stat label="Divisi" value={allDivisions?.length ?? 0} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/assign" className="inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium bg-[#E5E2E1] text-[#191919] hover:bg-white transition-colors">
            <Plus className="h-4 w-4" /> Assign Role
          </Link>
          <Link href="/dashboard/users" className="inline-flex h-9 items-center gap-2 rounded px-4 text-sm text-[#9B9A97] hover:bg-[#2C2C2C] transition-colors">
            <Users className="h-4 w-4" /> Kelola Anggota
          </Link>
          <Link href="/dashboard/divisions" className="inline-flex h-9 items-center gap-2 rounded px-4 text-sm text-[#9B9A97] hover:bg-[#2C2C2C] transition-colors">
            <Tags className="h-4 w-4" /> Kelola Divisi
          </Link>
          <Link href="/dashboard/teams" className="inline-flex h-9 items-center gap-2 rounded px-4 text-sm text-[#9B9A97] hover:bg-[#2C2C2C] transition-colors">
            <Settings className="h-4 w-4" /> Setting Tim
          </Link>
          <Link href="/dashboard/export" className="inline-flex h-9 items-center gap-2 rounded px-4 text-sm text-[#9B9A97] hover:bg-[#2C2C2C] transition-colors">
            <FileOutput className="h-4 w-4" /> Export Data
          </Link>
        </div>

        {/* Buat Tim */}
        <div className="border border-[#2D2D2D] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#E5E2E1] mb-4">Buat Tim Baru</h2>
          <CreateTeamForm existingDivisions={(allDivisions ?? []).filter((d) => !d.organization_id).map((d) => ({ id: d.id, name: d.name }))} />
        </div>

        {/* Manager — Tim & Divisi (max 7) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/managers"
              className="group flex items-center gap-2 text-lg font-semibold text-[#E5E2E1] hover:text-white transition-colors"
            >
              <Shield className="h-4 w-4 text-[#9B9A97]" />
              <span>Manager — Tim & Divisi</span>
              <ChevronRight className="h-4 w-4 text-[#9B9A97] transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ManagerTimDivisiTable
            rows={managers.map((m) => {
              const p = (profiles ?? []).find((pr) => pr.id === m.user_id);
              const org = (orgs ?? []).find((o) => o.id === m.organization_id);
              const orgDivs = (allDivisions ?? []).filter((d) => d.organization_id === m.organization_id).map((d) => ({ id: d.id, name: d.name }));
              return {
                memberId: m.id,
                managerName: p?.full_name ?? p?.display_name ?? p?.username ?? "—",
                orgId: m.organization_id,
                orgName: org?.name ?? "—",
                divisions: orgDivs,
              };
            })}
            allDivisions={(allDivisions ?? []).map((d) => ({ id: d.id, name: d.name, organizationId: d.organization_id }))}
          />
        </div>

        {/* User Active (max 7) */}
        <HomeSection
          title="User Active"
          icon={<Users className="h-4 w-4 text-[#9B9A97]" />}
          href="/dashboard/users"
          emptyText="Belum ada user"
          rows={(profiles ?? []).map((p) => {
            const role = roleMap.get(p.id) ?? "none";
            const email = emailMap.get(p.id) ?? "—";
            const userMembership = (members ?? []).find((m) => m.user_id === p.id);
            const divName = userMembership?.division_id
              ? (allDivisions ?? []).find((d) => d.id === userMembership.division_id)?.name ?? null
              : null;
            const orgName = userMembership
              ? (orgs ?? []).find((o) => o.id === userMembership.organization_id)?.name ?? null
              : null;
            const detail: UserDetail = {
              id: p.id,
              fullName: p.full_name,
              username: p.username,
              email,
              phoneWa: p.phone_wa,
              dateOfBirth: null,
              bio: null,
              socialLinks: null,
              gameIds: null,
              role,
              division: divName,
              orgName,
            };
            return {
              id: p.id,
              cols: [p.full_name ?? p.display_name ?? "—", email, role],
              roleCol: 2,
              userDetail: detail,
            };
          })}
        />

        {/* Team Health Score */}
        {healthScore && (
          <TeamHealthScore score={healthScore} />
        )}

        {/* Tim / Organisasi (max 7) */}
        <HomeOrgSection
          orgs={(orgs ?? []).slice(0, 7).map((org) => {
            // Get members for this org (exclude owner)
            const orgMembers = (members ?? [])
              .filter((m) => m.organization_id === org.id && m.role !== "owner")
              .map((m) => {
                const p = (profiles ?? []).find((pr) => pr.id === m.user_id);
                const div = m.division_id
                  ? (allDivisions ?? []).find((d) => d.id === m.division_id)?.name ?? null
                  : null;
                return {
                  name: p?.full_name ?? p?.display_name ?? p?.username ?? "—",
                  role: m.role,
                  division: div,
                };
              });
            return {
              id: org.id,
              name: org.name,
              divisions: (allDivisions ?? []).filter((d) => d.organization_id === org.id).map((d) => d.name).join(", "),
              memberCount: orgMembers.length,
              members: orgMembers,
            };
          })}
        />
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[#9B9A97] text-xs font-medium uppercase tracking-wider">{label}</span>
      <span className="text-[#E5E2E1] text-3xl font-bold tabular-nums tracking-tight leading-none">{value}</span>
    </div>
  );
}


