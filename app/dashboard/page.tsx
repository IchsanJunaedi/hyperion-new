import { Crown, Plus, Users } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logoutAction } from "@/lib/actions/auth";
import { DashboardLoginForm } from "@/features/dashboard/components/DashboardLoginForm";
import { CreateTeamForm } from "@/features/dashboard/components/CreateTeamForm";
import { OrgCard } from "@/features/dashboard/components/OrgCard";
import { UserActiveTable } from "@/features/dashboard/components/UserActiveTable";
import type { UserDetail } from "@/features/dashboard/components/UserDetailModal";
import { ManagerAssignmentsTable } from "@/features/dashboard/components/ManagerAssignmentsTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → show owner login form
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Owner Dashboard</h1>
            <p className="mt-1 text-sm text-white/60">
              Login untuk mengakses panel admin.
            </p>
          </div>
          <DashboardLoginForm />
        </div>
      </div>
    );
  }

  // Logged in but not owner → access denied
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-white/60">
            Halaman ini hanya untuk Owner.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-yellow-400 hover:underline">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  // Owner is logged in → show dashboard
  const admin = createAdminClient();

  const { data: profiles, count: totalUsers } = await admin
    .from("profiles")
    .select("id, full_name, username, display_name, phone_wa, date_of_birth, bio, social_links, game_ids, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .limit(50);

  // Get emails from auth.users
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 50 });
  const emailMap = new Map<string, string>();
  for (const u of authUsers?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, slug, tier, created_at")
    .order("created_at", { ascending: false });

  const { data: members } = await admin
    .from("team_members")
    .select("id, user_id, organization_id, division_id, role, is_active")
    .eq("is_active", true);

  // Get all divisions for manager section
  const { data: allDivisions } = await admin
    .from("divisions")
    .select("id, name, organization_id")
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Build role map: user_id → highest role
  const roleMap = new Map<string, string>();
  const rolePriority: Record<string, number> = { owner: 0, manager: 1, coach: 2, captain: 3, member: 4 };
  for (const m of members ?? []) {
    const existing = roleMap.get(m.user_id);
    if (!existing || (rolePriority[m.role] ?? 99) < (rolePriority[existing] ?? 99)) {
      roleMap.set(m.user_id, m.role);
    }
  }

  // Owner by email — override roleMap
  const ownerEmailForMap = process.env.OWNER_EMAIL;
  if (ownerEmailForMap) {
    for (const [uid, email] of emailMap.entries()) {
      if (email === ownerEmailForMap) {
        roleMap.set(uid, "owner");
      }
    }
  }

  return (
    <>
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <span className="text-sm font-bold text-yellow-400">Owner Dashboard</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50">{user.email}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-white/60">
            Kelola semua user, tim, dan role dari sini.
          </p>
        </header>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total User" value={totalUsers ?? 0} />
          <StatCard label="Total Tim" value={orgs?.length ?? 0} />
          <StatCard label="Member Aktif" value={members?.length ?? 0} />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/assign"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            <Plus className="h-4 w-4" />
            Assign Role
          </Link>
          <Link
            href="/dashboard/users"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Users className="h-4 w-4" />
            Kelola Anggota
          </Link>
          <Link
            href="/dashboard/divisions"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Kelola Divisi
          </Link>
          <Link
            href="/dashboard/teams"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Crown className="h-4 w-4" />
            Setting Tim
          </Link>
          <Link
            href="/dashboard/export"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Export Data
          </Link>
          <Link
            href="/dashboard/audit"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Audit Log
          </Link>
        </div>

        {/* Create Team */}
        <section className="rounded-xl border border-white/10 bg-zinc-900/40 p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Buat Tim Baru</h2>
          <CreateTeamForm existingDivisions={(allDivisions ?? []).map((d) => ({ id: d.id, name: d.name }))} />
        </section>

        {/* Manager — Tim & Divisi (preview) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Manager — Tim & Divisi</h2>
            <Link href="/dashboard/managers" className="text-xs text-yellow-400 hover:text-yellow-300">Lihat Semua →</Link>
          </div>
          <ManagerAssignmentsTable
            members={members ?? []}
            profiles={profiles ?? []}
            orgs={(orgs ?? []).map((o) => ({ id: o.id, name: o.name, slug: o.slug, tier: o.tier }))}
            allDivisions={(allDivisions ?? []).map((d) => ({
              id: d.id,
              name: d.name,
              organization_id: d.organization_id,
            }))}
          />
        </section>

        {/* User Active (preview 5) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">User Active</h2>
              <p className="text-xs text-white/50">Klik user untuk lihat detail</p>
            </div>
            <Link href="/dashboard/users" className="text-xs text-yellow-400 hover:text-yellow-300">Lihat Semua ({totalUsers ?? 0}) →</Link>
          </div>
          <UserActiveTable
            users={sortByRoleHierarchy(profiles ?? [], roleMap).slice(0, 5).map((p): UserDetail => {
              const userMembership = (members ?? []).find((m) => m.user_id === p.id);
              const divName = userMembership?.division_id
                ? (allDivisions ?? []).find((d) => d.id === userMembership.division_id)?.name ?? null
                : null;
              const orgName = userMembership
                ? (orgs ?? []).find((o) => o.id === userMembership.organization_id)?.name ?? null
                : null;
              const ownerEmailEnv = process.env.OWNER_EMAIL;
              const email = emailMap.get(p.id) ?? null;
              const role = email === ownerEmailEnv ? "owner" : (roleMap.get(p.id) ?? null);
              return {
                id: p.id,
                fullName: p.full_name,
                username: p.username,
                email,
                phoneWa: p.phone_wa,
                dateOfBirth: p.date_of_birth,
                bio: p.bio,
                socialLinks: (p.social_links as Record<string, string>) ?? null,
                gameIds: (p.game_ids as Record<string, string>) ?? null,
                role,
                division: divName,
                orgName,
              };
            })}
          />
        </section>

        {/* Tim / Organisasi (preview) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Tim / Organisasi</h2>
            <Link href="/dashboard/teams" className="text-xs text-yellow-400 hover:text-yellow-300">Lihat Semua →</Link>
          </div>
          {(!orgs || orgs.length === 0) ? (
            <p className="text-sm text-white/40">Belum ada tim. Buat di atas.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(orgs ?? []).slice(0, 6).map((org) => {
                const orgDivs = (allDivisions ?? [])
                  .filter((d) => d.organization_id === org.id)
                  .map((d) => ({ id: d.id, name: d.name }));
                return (
                  <OrgCard
                    key={org.id}
                    org={org}
                    divisions={orgDivs}
                    allDivisions={(allDivisions ?? []).map((d) => ({ id: d.id, name: d.name, organizationId: d.organization_id }))}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
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


function sortByRoleHierarchy<T extends { id: string }>(
  profiles: T[],
  roleMap: Map<string, string>,
): T[] {
  const priority: Record<string, number> = {
    owner: 0,
    manager: 1,
    coach: 2,
    captain: 3,
    member: 4,
  };
  return [...profiles].sort((a, b) => {
    const roleA = roleMap.get(a.id) ?? "none";
    const roleB = roleMap.get(b.id) ?? "none";
    const pA = priority[roleA] ?? 99;
    const pB = priority[roleB] ?? 99;
    return pA - pB;
  });
}
