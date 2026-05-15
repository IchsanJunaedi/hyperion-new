import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RemoveMemberButton } from "@/features/dashboard/components/RemoveMemberButton";

export const dynamic = "force-dynamic";

export default async function DashboardUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const admin = createAdminClient();

  // Get ALL profiles
  const { data: allProfiles } = await admin
    .from("profiles")
    .select("id, full_name, username, display_name, phone_wa")
    .order("full_name", { ascending: true });

  // Get all team members
  const { data: members } = await admin
    .from("team_members")
    .select("id, user_id, organization_id, division_id, role, is_active")
    .order("role", { ascending: true });

  // Get orgs + divisions
  const { data: orgs } = await admin.from("organizations").select("id, name");
  const { data: divisions } = await admin.from("divisions").select("id, name, organization_id").eq("is_active", true);
  const orgMap = new Map((orgs ?? []).map((o) => [o.id, o]));
  const divMap = new Map((divisions ?? []).map((d) => [d.id, d]));

  // Get emails
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 500 });
  const emailMap = new Map<string, string>();
  for (const u of authUsers?.users ?? []) { if (u.email) emailMap.set(u.id, u.email); }

  const ownerEmail = process.env.OWNER_EMAIL;
  const rolePriority: Record<string, number> = { owner: 0, manager: 1, coach: 2, captain: 3, member: 4 };

  // Build rows: membership rows + unassigned users
  type RowData = {
    key: string;
    memberId: string | null;
    userId: string;
    name: string;
    email: string;
    phoneWa: string;
    orgName: string;
    divName: string;
    role: string;
    isActive: boolean;
  };

  const rows: RowData[] = [];

  for (const m of members ?? []) {
    const p = (allProfiles ?? []).find((pr) => pr.id === m.user_id);
    const org = orgMap.get(m.organization_id);
    const div = m.division_id ? divMap.get(m.division_id) : null;
    rows.push({
      key: m.id,
      memberId: m.id,
      userId: m.user_id,
      name: p?.full_name ?? p?.display_name ?? p?.username ?? "—",
      email: emailMap.get(m.user_id) ?? "—",
      phoneWa: p?.phone_wa ?? "—",
      orgName: org?.name ?? "—",
      divName: div?.name ?? "—",
      role: m.role,
      isActive: m.is_active,
    });
  }

  // Unassigned users
  const assignedUserIds = new Set((members ?? []).map((m) => m.user_id));
  for (const p of allProfiles ?? []) {
    if (assignedUserIds.has(p.id)) continue;
    const email = emailMap.get(p.id);
    if (email === ownerEmail) continue;
    rows.push({
      key: `unassigned-${p.id}`,
      memberId: null,
      userId: p.id,
      name: p.full_name ?? p.display_name ?? p.username ?? "—",
      email: email ?? "—",
      phoneWa: p.phone_wa ?? "—",
      orgName: "—",
      divName: "—",
      role: "none",
      isActive: true,
    });
  }

  rows.sort((a, b) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99));

  return (
    <>
      <header className="h-12 flex items-center px-6 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
          <Link href="/dashboard" className="hover:text-[#D4D4D4]">Home</Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">User Active</span>
        </div>
      </header>

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-8 py-12">
        <div className="mb-8">
          <Users className="h-8 w-8 text-[#9B9A97] mb-3" />
          <h1 className="font-bold text-[28px] text-[#E5E2E1]">Semua User</h1>
          <p className="text-[#9B9A97] mt-1 text-sm">
            Semua user terdaftar. User "none" belum di-assign ke tim.
          </p>
        </div>

        <div className="flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_120px_120px_80px_80px_40px] gap-3 px-3 py-2 text-xs font-medium text-[#6B6A68] border-b border-[#2D2D2D]">
            <span>Nama</span>
            <span>Email</span>
            <span>WA</span>
            <span>Tim</span>
            <span>Divisi</span>
            <span>Role</span>
            <span></span>
          </div>

          {/* Rows */}
          {rows.map((r) => (
            <div
              key={r.key}
              className="grid grid-cols-[1fr_1fr_120px_120px_80px_80px_40px] gap-3 px-3 py-2 items-center hover:bg-[#2C2C2C] rounded transition-colors text-sm"
            >
              <span className="text-[#D4D4D4] truncate">{r.name}</span>
              <span className="text-[#9B9A97] truncate">{r.email}</span>
              <span className="text-[#9B9A97] truncate text-xs">{r.phoneWa}</span>
              <span className="text-[#9B9A97] truncate text-xs">{r.orgName}</span>
              <span className="text-[#9B9A97] truncate text-xs">{r.divName}</span>
              <span className={`text-xs font-medium ${
                r.role === "owner" ? "text-yellow-400" :
                r.role === "manager" ? "text-green-400" :
                r.role === "coach" ? "text-blue-400" :
                r.role === "captain" ? "text-purple-400" :
                r.role === "member" ? "text-[#9B9A97]" :
                "text-[#6B6A68]"
              }`}>{r.role}</span>
              <span>
                {r.memberId && r.role !== "owner" && (
                  <RemoveMemberButton memberId={r.memberId} name={r.name} />
                )}
              </span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
