import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug, getPublicTeamData } from "@/features/teams/queries";
import { TournamentForm } from "@/features/tournaments/components/TournamentForm";

export const dynamic = "force-dynamic";

interface NewTournamentPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function NewTournamentPage({ params }: NewTournamentPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  const canManage = ["captain", "manager", "owner"].includes(currentUserRole ?? "");
  if (!canManage) redirect(`/${slug}/tournaments`);

  const { divisions } = await getPublicTeamData(organization);
  const divisionId = divisions[0]?.id;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 max-w-2xl mx-auto w-full">
      <header className="flex flex-col items-center text-center space-y-3">
        <Link
          href={`/${slug}/tournaments`}
          className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-all duration-300 hover:bg-zinc-800/60 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke daftar turnamen
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl tracking-tight">Tambah Turnamen</h1>
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6 w-full shadow-xl shadow-black/20">
        {!divisionId ? (
          <p className="text-sm text-white/65 text-center">
            Tim belum punya divisi aktif. Tambah divisi terlebih dahulu.
          </p>
        ) : (
          <TournamentForm
            orgSlug={slug}
            divisionId={divisionId}
          />
        )}
      </div>
    </div>
  );
}
