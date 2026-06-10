import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ExportButtons } from "@/features/dashboard/components/ExportButtons";

export const dynamic = "force-dynamic";

export default async function DashboardExportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const workspaceName = profile?.full_name ?? "Hyperion Team";

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-ui-text">Export Data Tim</h1>
          <p className="mt-1 text-sm text-white/60">
            Download semua data tim dalam format CSV. Data termasuk member, scrim, hasil, dan pengumuman.
          </p>
        </header>

        <ExportButtons />
      </main>
    </>
  );
}
