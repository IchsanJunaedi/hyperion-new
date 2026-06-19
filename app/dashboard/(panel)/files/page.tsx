import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

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
  const { data: orgs } = await admin.from("organizations").select("id, name").eq("owner_id", user.id).order("created_at");
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-8 w-8 text-ui-text-2" />
            <h1 className="text-2xl font-bold text-ui-text sm:text-3xl tracking-tight">
              File Tim
            </h1>
          </div>
          <p className="mt-1 text-sm text-ui-text-2">
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
