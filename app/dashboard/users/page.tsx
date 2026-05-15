import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MemberManageRow } from "@/features/dashboard/components/MemberManageRow";

export const dynamic = "force-dynamic";

export default async function DashboardUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const admin = createAdminClient();

  // Get ALL profiles (not just those with memberships)
  const { data: allProfiles } = await admin
    .from("profiles")
    .select("id, full_name, username, display_name, phone_wa")
    .order("full_name", { ascending: true });

  // Get all team members
  const { data: members } = await admin
    .from("team_members")
    .select("id, user_id, organization_id, division_id, role, is_active")
    .order("role", { ascending: true });

  // Get orgs
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, slug");

  const orgMap = new Map((orgs ?? []).map((o) => [o.id, o]));

  // Get emails
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 500 });
  const emailMap = new Map<string, string>();
  for (const u of authUsers?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  // Build: for each profile, find their memberships
  // Users with memberships show as rows per membership
  // Users WITHOUT memberships show as a single "none" row
  const ownerEmail = process.env.OWNER_EMAIL;

  // Role priority for sorting
  const rolePriority: Record<string, number> = { owner: 0, manager: 1, coach: 2, captain: 3, member: 4 };

  // Build combined list: memberships + unassigned users
  type RowData = {
    key: string;
    memberId: string | null;
    name: string;
    orgName: string;
    role: string;
    isActive: boolean;
  };

  const rows: RowData[] = [];

  // Add all membership rows
  for (const m of members ?? []) {
    const p = (allProfiles ?? []).find((pr) => pr.id === m.user_id);
    const org = orgMap.get(m.organization_id);
    rows.push({
      key: m.id,
      memberId: m.id,
      name: p?.full_name ?? p?.display_name ?? p?.username ?? emailMap.get(m.user_id) ?? "—",
      orgName: org?.name ?? "—",
      role: m.role,
      isActive: m.is_active,
    });
  }

  // Add unassigned users (those with no membership at all)
  const assignedUserIds = new Set((members ?? []).map((m) => m.user_id));
  for (const p of allProfiles ?? []) {
    if (assignedUserIds.has(p.id)) continue;
    const email = emailMap.get(p.id);
    // Skip owner (they're shown via membership rows or identified by email)
    if (email === ownerEmail) continue;
    rows.push({
      key: `unassigned-${p.id}`,
      memberId: null,
      name: p.full_name ?? p.display_name ?? p.username ?? email ?? "—",
      orgName: "—",
      role: "none",
      isActive: true,
    });
  }

  // Sort: owner first, then manager, captain, member, none last
  rows.sort((a, b) => {
    const pA = rolePriority[a.role] ?? 99;
    const pB = rolePriority[b.role] ?? 99;
    return pA - pB;
  });

  return (
    <>
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-white">← Dashboard</Link>
            <span className="text-sm font-bold text-yellow-400">Kelola Anggota</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white">Semua User</h1>
          <p className="mt-1 text-sm text-white/60">
            Semua user terdaftar. Ubah role atau hapus dari tim. User "none" belum di-assign ke tim manapun.
          </p>
        </header>

        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Tim</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/50">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) =>
                r.memberId ? (
                  <MemberManageRow
                    key={r.key}
                    memberId={r.memberId}
                    name={r.name}
                    orgName={r.orgName}
                    role={r.role}
                    isActive={r.isActive}
                  />
                ) : (
                  <tr key={r.key} className="transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white/80">{r.name}</td>
                    <td className="px-4 py-3 text-white/40">—</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/30">none</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/40">Belum di-assign</span>
                    </td>
                    <td className="px-4 py-3 text-right" />
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
