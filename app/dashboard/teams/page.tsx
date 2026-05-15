import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrgSettingsCard } from "@/features/dashboard/components/OrgSettingsCard";

export const dynamic = "force-dynamic";

export default async function DashboardTeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: orgs } = await admin
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: divisions } = await admin
    .from("divisions")
    .select("*")
    .order("name", { ascending: true });

  return (
    <>
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-white">← Dashboard</Link>
            <span className="text-sm font-bold text-yellow-400">Kelola Tim</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white">Setting Tim & Divisi</h1>
          <p className="mt-1 text-sm text-white/60">
            Edit nama, logo, paket tim. Arsipkan atau hapus divisi.
          </p>
        </header>

        {(orgs ?? []).map((org) => {
          const orgDivisions = (divisions ?? []).filter(
            (d) => d.organization_id === org.id,
          );
          return (
            <OrgSettingsCard
              key={org.id}
              org={org}
              divisions={orgDivisions}
            />
          );
        })}
      </main>
    </>
  );
}
