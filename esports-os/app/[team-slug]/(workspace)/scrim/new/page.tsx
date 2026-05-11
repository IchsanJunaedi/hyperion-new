import Link from "next/link";
import { notFound } from "next/navigation";

import { ScrimForm } from "@/features/scrim/components/ScrimForm";
import { getPublicTeamData, getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface NewScrimPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function NewScrimPage({ params }: NewScrimPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const { divisions } = await getPublicTeamData(organization);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-1">
        <Link
          href={`/${slug}/scrim`}
          className="text-xs text-white/55 hover:text-white"
        >
          ← Kembali ke daftar scrim
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Buat scrim baru
        </h1>
        <p className="text-sm text-white/65">
          Semua member divisi akan otomatis menerima notifikasi (in-app +
          WhatsApp jika nomor terdaftar).
        </p>
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
