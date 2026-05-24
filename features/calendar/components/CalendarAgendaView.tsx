"use client";

import Link from "next/link";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { Database } from "@/types/database";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

const EVENT_TYPE_LABELS: Record<string, string> = {
  tournament: "Turnamen",
  practice: "Latihan",
  meeting: "Meeting",
  bootcamp: "Bootcamp",
  other: "Lainnya",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  tournament: "bg-yellow-400",
  practice: "bg-green-400",
  meeting: "bg-purple-400",
  bootcamp: "bg-rose-400",
  other: "bg-white/40",
};

interface CalendarAgendaViewProps {
  orgSlug: string;
  events: CalendarEvent[];
  readOnly?: boolean;
}

export function CalendarAgendaView({ orgSlug, events, readOnly = false }: CalendarAgendaViewProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  // Group by date (WIB)
  const groups = new Map<string, { label: string; events: CalendarEvent[] }>();
  for (const ev of sorted) {
    const wibDate = new Date(new Date(ev.starts_at).getTime() + 7 * 60 * 60 * 1000);
    const key = wibDate.toISOString().slice(0, 10);
    if (!groups.has(key)) {
      const label = wibDate.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long",
        timeZone: "Asia/Jakarta",
      });
      groups.set(key, { label, events: [] });
    }
    groups.get(key)!.events.push(ev);
  }

  if (groups.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30">
        <Calendar className="h-10 w-10 mb-3" />
        <p className="text-sm">Tidak ada event bulan ini</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([dateKey, group]) => {
        const isToday = dateKey === new Date().toISOString().slice(0, 10);
        return (
          <div key={dateKey}>
            <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${isToday ? "text-yellow-400" : "text-white/40"}`}>
              {isToday && <span className="inline-flex h-1.5 w-1.5 rounded-full bg-yellow-400" />}
              {group.label}
              {isToday && <span className="text-[10px] font-normal normal-case text-yellow-400/70">(Hari ini)</span>}
            </div>
            <div className="space-y-1.5">
              {group.events.map((ev) => {
                const timeStr = new Date(ev.starts_at).toLocaleString("id-ID", {
                  hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
                });
                const endStr = ev.ends_at
                  ? new Date(ev.ends_at).toLocaleString("id-ID", {
                      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
                    })
                  : null;

                let href = `/${orgSlug}/calendar/${ev.id}`;
                if (!readOnly) {
                  if (ev.event_type === "scrim" || ev.ref_type === "scrim") {
                    href = `/${orgSlug}/scrim/${ev.ref_id || ev.id.replace("scrim-", "")}`;
                  } else if (ev.event_type === "tournament" || ev.ref_type === "tournament") {
                    href = `/${orgSlug}/tournaments/${ev.ref_id || ev.id.replace("tournament-", "")}`;
                  }
                }

                const card = (
                  <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-3 transition hover:bg-zinc-900/70">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${EVENT_TYPE_COLORS[ev.event_type] ?? "bg-white/40"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white/90">{ev.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/40">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {ev.is_all_day ? "Seharian" : `${timeStr}${endStr ? ` — ${endStr}` : ""}`}
                        </span>
                        {ev.location && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {ev.location}
                          </span>
                        )}
                        <span className="shrink-0 text-white/30">{EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}</span>
                      </div>
                    </div>
                  </div>
                );

                if (readOnly) return <div key={ev.id}>{card}</div>;
                return <Link key={ev.id} href={href}>{card}</Link>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
