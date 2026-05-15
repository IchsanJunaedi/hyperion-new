import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CalendarGrid } from "@/features/calendar/components/CalendarGrid";
import { listUnifiedCalendarEvents } from "@/features/calendar/unified";
import { getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{ y?: string; m?: string }>;
}

export default async function CalendarPage({
  params,
  searchParams,
}: CalendarPageProps) {
  const [{ "team-slug": slug }, sp] = await Promise.all([params, searchParams]);
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const now = new Date();
  const year = sp.y ? parseInt(sp.y, 10) : now.getFullYear();
  const month = sp.m ? parseInt(sp.m, 10) : now.getMonth(); // 0-indexed

  // Compute WIB-aware month boundaries for the query
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const startUtcMs = Date.UTC(year, month, 1) - WIB_OFFSET_MS;
  const endUtcMs = Date.UTC(year, month + 1, 0, 23, 59, 59) - WIB_OFFSET_MS;
  const from = new Date(startUtcMs).toISOString();
  const to = new Date(endUtcMs).toISOString();

  const events = await listUnifiedCalendarEvents(organization.id, from, to);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/55">
            Calendar
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Kalender Tim
          </h1>
        </div>
        <Link
          href={`/${slug}/calendar/new`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" />
          Tambah event
        </Link>
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 sm:p-6">
        <CalendarGrid
          orgSlug={slug}
          events={events}
          year={year}
          month={month}
        />
      </div>
    </div>
  );
}
