import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CalendarEventForm } from "@/features/calendar/components/CalendarEventForm";
import { getOrgBySlug, getPublicTeamData } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface NewCalendarEventPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function NewCalendarEventPage({
  params,
}: NewCalendarEventPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const { divisions } = await getPublicTeamData(organization);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      {/* Tombol Kembali */}
      <div className="flex justify-start">
        <Link
          href={`/${slug}/calendar`}
          className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-all duration-300 hover:bg-zinc-800/60 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke kalender
        </Link>
      </div>

      {/* Konten Terpusat: Judul & Card Form */}
      <div className="mx-auto max-w-2xl w-full space-y-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl tracking-tight text-left">
          Tambah Event Baru
        </h1>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6 w-full shadow-xl shadow-black/20">
          <CalendarEventForm
            orgSlug={slug}
            divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
          />
        </div>
      </div>
    </div>
  );
}
