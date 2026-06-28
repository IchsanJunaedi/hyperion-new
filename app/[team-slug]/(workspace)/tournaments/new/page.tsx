import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug, getPublicTeamData } from "@/features/teams/queries";
import { TournamentForm } from "@/features/tournaments/components/TournamentForm";
import { getActivePatch } from "@/features/meta/queries";

export const dynamic = "force-dynamic";

interface NewTournamentPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function NewTournamentPage({ params }: NewTournamentPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  const canManage = ["captain", "coach", "manager", "owner"].includes(currentUserRole ?? "");
  if (!canManage) redirect(`/${slug}/tournaments`);

  const { divisions } = await getPublicTeamData(organization);
  const divisionId = divisions[0]?.id;
  const activePatch = await getActivePatch(organization.id);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      {/* Tombol Kembali - Di kiri halaman di bawah breadcrumbs */}
      <div className="flex justify-start">
        <Link
          href={`/${slug}/tournaments`}
          className="group inline-flex items-center gap-2 rounded-full border border-ui-border bg-ui-surface/40 px-3.5 py-1.5 text-xs font-semibold text-ui-text-2 transition-all duration-300 hover:bg-ui-elevated/60 hover:text-ui-text"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke daftar turnamen
        </Link>
      </div>

      {/* Konten Terpusat: Judul & Card Form */}
      <div className="mx-auto max-w-2xl w-full space-y-4">
        <h1 className="text-2xl font-bold text-ui-text sm:text-3xl tracking-tight text-left">Tambah Turnamen</h1>

        <div className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5 sm:p-6 w-full shadow-xl shadow-black/20">
          {!divisionId ? (
            <p className="text-sm text-ui-text-2 text-center">
              Tim belum punya divisi aktif. Tambah divisi terlebih dahulu.
            </p>
          ) : (
            <TournamentForm
              orgSlug={slug}
              divisionId={divisionId}
              activePatchVersion={activePatch?.patch_version}
            />
          )}
        </div>
      </div>
    </div>
  );
}
