import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrgSettingsCard } from "@/features/dashboard/components/OrgSettingsCard";

export const dynamic = "force-dynamic";

export default async function DashboardTeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

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
      <main className="flex-1 max-w-[900px] w-full mx-auto px-8 py-12">
        <div className="mb-8">
          <Building2 className="h-8 w-8 text-[#9B9A97] mb-3" />
          <h1 className="font-bold text-[28px] text-[#E5E2E1]">Setting Tim</h1>
          <p className="text-[#9B9A97] mt-1 text-sm">
            Edit nama tim dan kelola divisi per tim.
          </p>
        </div>

        {(!orgs || orgs.length === 0) ? (
          <p className="text-sm text-[#6B6A68] py-8">Belum ada tim.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {orgs.map((org) => {
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
          </div>
        )}
      </main>
    </>
  );
}
