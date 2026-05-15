import { Calendar, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCalendarEvent } from "@/features/calendar/queries";
import { CalendarEventActions } from "@/features/calendar/components/CalendarEventActions";

export const dynamic = "force-dynamic";

interface CalendarEventDetailPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  scrim: "Scrim",
  tournament: "Turnamen",
  practice: "Latihan",
  meeting: "Meeting",
  other: "Lainnya",
};

export default async function CalendarEventDetailPage({
  params,
}: CalendarEventDetailPageProps) {
  const { "team-slug": slug, id } = await params;
  const event = await getCalendarEvent(id);
  if (!event) notFound();

  const startsAt = new Date(event.starts_at).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  const endsAt = event.ends_at
    ? new Date(event.ends_at).toLocaleString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      })
    : null;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-2">
        <Link
          href={`/${slug}/calendar`}
          className="text-xs text-white/55 hover:text-white"
        >
          ← Kalender
        </Link>
        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-white/60">
          {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
        </span>
        <h1 className="text-3xl font-bold text-white">{event.title}</h1>
        <dl className="grid gap-1 text-sm text-white/70 sm:grid-cols-2">
          <div className="inline-flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-white/55" />
            {startsAt}
            {endsAt ? ` — ${endsAt}` : ""}
          </div>
          {event.location && (
            <div className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-white/55" />
              {event.location}
            </div>
          )}
        </dl>
      </header>

      {event.description && (
        <article className="max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
          <div className="whitespace-pre-line text-sm leading-relaxed text-white/85">
            {event.description}
          </div>
        </article>
      )}

      <CalendarEventActions orgSlug={slug} eventId={event.id} />
    </div>
  );
}
