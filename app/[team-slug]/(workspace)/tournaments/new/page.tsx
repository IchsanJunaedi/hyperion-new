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

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-1">
        <Link
          href={`/${slug}/tournaments`}
          className="text-xs text-white/55 hover:text-white"
        >
          ← Kembali ke daftar turnamen
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Tambah Turnamen</h1>
      </header>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        {divisions.length === 0 ? (
          <p className="text-sm text-white/65">
            Tim belum punya divisi aktif. Tambah divisi terlebih dahulu.
          </p>
        ) : (
          <TournamentForm
            orgSlug={slug}
            divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
          />
        )}
      </div>
    </div>
  );
}
