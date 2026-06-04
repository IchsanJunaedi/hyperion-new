import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminFileManager } from "@/features/dashboard/components/AdminFileManager";

export const dynamic = "force-dynamic";

export default async function DashboardFilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL || process.env.E2E_OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();

  // Queries
  const { data: profiles } = await admin.from("profiles").select("id, full_name, display_name");
  const workspaceName = profiles?.find((p) => p.id === user.id)?.full_name ?? "Hyperion Team";

  const { data: orgs } = await admin.from("organizations").select("id, name").order("created_at");
  const { data: dbFiles } = await admin
    .from("files")
    .select("id, file_name, file_type, file_size, storage_path, created_at, organization_id, uploaded_by")
    .order("created_at", { ascending: false });

  // Map files with org name and profile display name
  const mappedFiles = (dbFiles ?? []).map((file) => {
    const org = orgs?.find((o) => o.id === file.organization_id);
    const uploader = profiles?.find((p) => p.id === file.uploaded_by);

    return {
      id: file.id,
      file_name: file.file_name,
      file_type: file.file_type,
      file_size: file.file_size,
      storage_path: file.storage_path,
      created_at: file.created_at,
      organization_id: file.organization_id,
      orgName: org?.name ?? "Tim Tidak Dikenal",
      uploadedByName: uploader?.display_name ?? "User Tidak Dikenal",
    };
  });

  return (
    <>
      <header className="h-12 flex items-center px-6 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
          <Link href="/dashboard" className="hover:text-[#D4D4D4]">Home</Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">File Tim</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-8 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl tracking-tight">
            File Tim
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Kelola dan unduh seluruh file yang diunggah oleh setiap divisi tim di platform Hyperion.
          </p>
        </div>

        <AdminFileManager
          initialFiles={mappedFiles}
          organizations={orgs ?? []}
        />
      </main>
    </>
  );
}
