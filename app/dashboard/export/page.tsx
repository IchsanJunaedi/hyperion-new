import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { ExportButtons } from "@/features/dashboard/components/ExportButtons";

export const dynamic = "force-dynamic";

export default async function DashboardExportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  return (
    <>
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-white">← Dashboard</Link>
            <span className="text-sm font-bold text-yellow-400">Export Data</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white">Export Data Tim</h1>
          <p className="mt-1 text-sm text-white/60">
            Download semua data tim dalam format CSV. Data termasuk member, scrim, hasil, dan pengumuman.
          </p>
        </header>

        <ExportButtons />
      </main>
    </>
  );
}
