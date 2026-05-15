import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DashboardManagersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: managers } = await admin
    .from("team_members")
    .select("id, user_id, organization_id, division_id, role")
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
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-white">← Dashboard</Link>
            <span className="text-sm font-bold text-yellow-400">Semua Manager</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">Manager — Tim & Divisi</h1>

        {(!managers || managers.length === 0) ? (
          <p className="text-sm text-white/40">Belum ada Manager.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Manager</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Tim</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50">Divisi Tim</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50">WA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {managers.map((m) => {
                  const p = profileMap.get(m.user_id);
                  const org = orgMap.get(m.organization_id);
                  const orgDivs = (divisions ?? []).filter((d) => d.organization_id === m.organization_id);
                  return (
                    <tr key={m.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white/80">{p?.full_name ?? p?.display_name ?? "—"}</td>
                      <td className="px-4 py-3 text-white/60">{org?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-white/60">
                        {orgDivs.length > 0 ? orgDivs.map((d) => d.name).join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-white/60">{p?.phone_wa ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
