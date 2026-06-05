import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ManagerTimDivisiTable } from "@/features/dashboard/components/ManagerTimDivisiTable";

export const dynamic = "force-dynamic";

export default async function DashboardManagersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();

  const { data: managers } = await admin
    .from("team_members")
    .select("id, user_id, organization_id, role")
    .eq("role", "manager")
    .eq("is_active", true);

  const userIds = [...new Set((managers ?? []).map((m) => m.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await admin.from("profiles").select("id, full_name, username, display_name, phone_wa").in("id", userIds)
    : { data: [] };

  const { data: orgs } = await admin.from("organizations").select("id, name, slug");
  const { data: divisions } = await admin.from("divisions").select("id, name, organization_id").eq("is_active", true);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const orgMap = new Map((orgs ?? []).map((o) => [o.id, o]));

  return (
    <>
      <main className="flex-1 max-w-[900px] w-full mx-auto px-8 py-12">
        <div className="mb-8">
          <Shield className="h-8 w-8 text-[#9B9A97] mb-3" />
          <h1 className="font-bold text-[28px] text-[#E5E2E1]">Manager — Tim & Divisi</h1>
          <p className="text-[#9B9A97] mt-1 text-sm">
            Kelola manager, edit nama tim, dan edit/hapus divisi.
          </p>
        </div>

        <ManagerTimDivisiTable
          rows={(managers ?? []).map((m) => {
            const p = profileMap.get(m.user_id);
            const org = orgMap.get(m.organization_id);
            const orgDivs = (divisions ?? [])
              .filter((d) => d.organization_id === m.organization_id)
              .map((d) => ({ id: d.id, name: d.name }));
            return {
              memberId: m.id,
              managerName: p?.full_name ?? p?.display_name ?? p?.username ?? "—",
              orgId: m.organization_id,
              orgName: org?.name ?? "—",
              divisions: orgDivs,
            };
          })}
          allDivisions={(divisions ?? []).map((d) => ({ id: d.id, name: d.name, organizationId: d.organization_id }))}
        />
      </main>
    </>
  );
}
