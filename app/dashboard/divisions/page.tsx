import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateDivisionForm } from "@/features/dashboard/components/CreateDivisionForm";
import { DivisionListItem } from "@/features/dashboard/components/DivisionListItem";

export const dynamic = "force-dynamic";

export default async function DashboardDivisionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: divisions } = await admin
    .from("divisions")
    .select("id, name, slug, is_active, organization_id, created_at")
    .is("organization_id", null)
    .order("name", { ascending: true });

  return (
    <>
      <header className="border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-white/50 hover:text-white">← Dashboard</Link>
            <span className="text-sm font-bold text-yellow-400">Kelola Divisi</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-white">Divisi</h1>
          <p className="mt-1 text-sm text-white/60">
            Buat, edit, dan hapus divisi. Divisi yang dibuat di sini bisa dipilih saat membuat tim baru.
          </p>
        </header>

        {/* Create new division */}
        <section className="max-w-lg rounded-xl border border-white/10 bg-zinc-900/40 p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">Buat Divisi Baru</h2>
          <CreateDivisionForm />
        </section>

        {/* Existing divisions */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Divisi yang Ada</h2>
          {(!divisions || divisions.length === 0) ? (
            <p className="text-sm text-white/40">Belum ada divisi.</p>
          ) : (
            <div className="space-y-2">
              {divisions.map((div) => (
                <DivisionListItem
                  key={div.id}
                  id={div.id}
                  name={div.name}
                  isActive={div.is_active}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
