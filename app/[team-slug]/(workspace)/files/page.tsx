import { notFound, redirect } from "next/navigation";

import { FileList } from "@/features/files/components/FileList";
import { FileUpload } from "@/features/files/components/FileUpload";
import { getOrgBySlug } from "@/features/teams/queries";
import { getCurrentUserRole } from "@/features/roster/queries";

export const dynamic = "force-dynamic";

interface FilesPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function FilesPage({ params }: FilesPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  if (!currentUserRole) redirect(`/${slug}`);

  const canUpload =
    currentUserRole === "owner" ||
    currentUserRole === "manager" ||
    currentUserRole === "coach";

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          File Tim
        </h1>
        <p className="mt-1 text-sm text-white/60">
          File tim: screenshot, replay, dokumen, strategi.
        </p>
      </header>

      {canUpload && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white">Upload file baru</h2>
          <div className="mt-3">
            <FileUpload orgSlug={slug} orgId={organization.id} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-white">
          File yang tersimpan
        </h2>
        <FileList orgId={organization.id} />
      </div>
    </div>
  );
}
