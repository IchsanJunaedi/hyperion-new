import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ScrimForm } from "@/features/scrim/components/ScrimForm";
import { getCurrentUserRole } from "@/features/roster/queries";
import { getPublicTeamData, getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface NewScrimPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function NewScrimPage({ params }: NewScrimPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  const canManageScrims = ["captain", "manager", "owner"].includes(currentUserRole ?? "");
  if (!canManageScrims) redirect(`/${slug}/scrim`);

  const { divisions } = await getPublicTeamData(organization);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-3">
        <Link
          href={`/${slug}/scrim`}
          className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-all duration-300 hover:bg-zinc-800/60 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke daftar scrim
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl tracking-tight">
          Buat Scrim Baru
        </h1>
      </header>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        {divisions.length === 0 ? (
          <p className="text-sm text-white/65">
            Tim belum punya divisi aktif. Tambah divisi di pengaturan tim
            sebelum membuat scrim.
          </p>
        ) : (
          <ScrimForm
            orgSlug={slug}
            divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
          />
        )}
      </div>
    </div>
  );
}
