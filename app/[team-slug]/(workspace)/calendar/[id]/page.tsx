import { ArrowLeft, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCalendarEvent, getMyRsvp, getRsvpCounts, getRsvpAttendees } from "@/features/calendar/queries";
import { CalendarEventActions } from "@/features/calendar/components/CalendarEventActions";
import { CalendarRsvpButtons } from "@/features/calendar/components/CalendarRsvpButtons";

export const dynamic = "force-dynamic";

interface CalendarEventDetailPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  tournament: "Turnamen",
  practice: "Latihan",
  meeting: "Meeting",
  bootcamp: "Bootcamp",
  other: "Lainnya",
};

const VISIBILITY_LABELS: Record<string, { label: string; style: string }> = {
  all: { label: "👥 Semua Tim", style: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  management: { label: "💼 Manajemen", style: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  coach_up: { label: "⚡ Coach & Manajemen", style: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" },
  private: { label: "🔒 Hanya Saya (Private)", style: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
};

export default async function CalendarEventDetailPage({
  params,
}: CalendarEventDetailPageProps) {
  const { "team-slug": slug, id } = await params;
  const [event, myRsvp, rsvpCounts, rsvpAttendees] = await Promise.all([
    getCalendarEvent(id),
    getMyRsvp(id),
    getRsvpCounts(id),
    getRsvpAttendees(id),
  ]);
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

      {/* Konten Terpusat */}
      <div className="mx-auto max-w-2xl w-full space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-white/60 border border-white/10">
            {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
          </span>
          {event.visibility && VISIBILITY_LABELS[event.visibility] && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${VISIBILITY_LABELS[event.visibility]!.style}`}>
              {VISIBILITY_LABELS[event.visibility]!.label}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-ui-text sm:text-3xl tracking-tight">{event.title}</h1>

        {/* Meta info */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
          <div className="inline-flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-white/40" />
            {startsAt}{endsAt ? ` — ${endsAt}` : ""}
          </div>
          {event.location && (
            <div className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-white/40" />
              {event.location}
            </div>
          )}
        </div>

        {/* Description card */}
        {event.description && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6 w-full shadow-xl shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Deskripsi</p>
            <div className="whitespace-pre-line text-sm leading-relaxed text-white/85">
              {event.description}
            </div>
          </div>
        )}

        {/* RSVP */}
        <CalendarRsvpButtons
          orgSlug={slug}
          eventId={event.id}
          currentStatus={myRsvp}
          rsvpCounts={rsvpCounts}
        />

        {/* RSVP attendee list */}
        {rsvpAttendees.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Respons anggota</p>
            {(["hadir", "tentative", "tidak_hadir"] as const).map((status) => {
              const group = rsvpAttendees.filter((a) => a.status === status);
              if (!group.length) return null;
              const config = {
                hadir: { label: "Hadir", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
                tentative: { label: "Mungkin", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
                tidak_hadir: { label: "Tidak Hadir", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
              }[status];
              return (
                <div key={status}>
                  <span className={`mb-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.cls}`}>
                    {config.label} · {group.length}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.map((a) => (
                      <span key={a.user_id} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/70">
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <CalendarEventActions orgSlug={slug} eventId={event.id} />
      </div>
    </div>
  );
}
