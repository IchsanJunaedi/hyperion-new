"use client";

import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Database } from "@/types/database";
import type { RsvpCountMap } from "@/features/calendar/queries";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

interface CalendarGridProps {
  orgSlug: string;
  events: CalendarEvent[];
  year: number;
  month: number; // 0-indexed
  readOnly?: boolean;
  /** Overrides the base path used for month navigation */
  navBasePath?: string;
  /** If true, clicking a date cell triggers onDayClick */
  canCreate?: boolean;
  /** Called when user clicks a day cell (when canCreate=true) */
  onDayClick?: (date: Date) => void;
  rsvpCounts?: RsvpCountMap;
  /** Per-event href overrides — when provided, events are always rendered as Links */
  eventHrefs?: Record<string, string>;
}

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const EVENT_TYPE_COLORS: Record<string, string> = {
  scrim: "bg-blue-400",
  tournament: "bg-yellow-400",
  practice: "bg-green-400",
  meeting: "bg-purple-400",
  other: "bg-white/40",
};

const CalendarGrid = ({
  orgSlug,
  events,
  year,
  month,
  readOnly = false,
  navBasePath,
  canCreate = false,
  onDayClick,
  rsvpCounts,
  eventHrefs,
}: CalendarGridProps) => {
  const router = useRouter();
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday = 0, Sunday = 6
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  const monthLabel = firstDay.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // Group events by day
  const eventsByDay = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    // Parse in WIB
    const eventDate = new Date(event.starts_at);
    const wibDate = new Date(eventDate.getTime() + 7 * 60 * 60 * 1000);
    const day = wibDate.getUTCDate();
    const eventMonth = wibDate.getUTCMonth();
    const eventYear = wibDate.getUTCFullYear();
    if (eventMonth === month && eventYear === year) {
      const existing = eventsByDay.get(day) ?? [];
      existing.push(event);
      eventsByDay.set(day, existing);
    }
  }

  function navigateMonth(delta: number) {
    const newDate = new Date(year, month + delta, 1);
    const base = navBasePath ?? (readOnly ? "/dashboard/calendar" : `/${orgSlug}/calendar`);
    const [pathOnly, existingQuery] = base.split("?");
    const params = new URLSearchParams(existingQuery);
    params.set("y", String(newDate.getFullYear()));
    params.set("m", String(newDate.getMonth()));
    router.push(`${pathOnly}?${params.toString()}`);
  }

  const today = new Date();
  const todayDay =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate()
      : -1;

  function handleDayClick(day: number) {
    if (!canCreate || !onDayClick) return;
    const clickedDate = new Date(year, month, day);
    onDayClick(clickedDate);
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="rounded-md p-2 text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold capitalize text-ui-text">
          {monthLabel}
        </h2>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="rounded-md p-2 text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-ui-text-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-ui-border bg-ui-elevated">
        {/* Empty cells before first day */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] bg-ui-bg p-1" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = eventsByDay.get(day) ?? [];
          const isToday = day === todayDay;
          const isClickable = canCreate && !!onDayClick;

          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={`group relative min-h-[80px] bg-ui-bg p-1 transition ${
                isToday ? "ring-1 ring-inset ring-yellow-400/30" : ""
              } ${isClickable ? "cursor-pointer hover:bg-ui-surface/80" : "hover:bg-ui-surface"}`}
            >
              {/* Day number + add button */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-yellow-400 font-bold text-black"
                      : "text-ui-text"
                  }`}
                >
                  {day}
                </span>

                {/* + button: visible on hover when canCreate */}
                {isClickable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayClick(day);
                    }}
                    className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded text-ui-text-muted transition hover:bg-ui-hover hover:text-ui-text"
                    aria-label={`Tambah event pada ${day}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Events */}
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => {
                  const rsvp = rsvpCounts?.[ev.id];
                  const hadirCount = rsvp?.hadir ?? 0;
                  const tentativeCount = rsvp?.tentative ?? 0;

                  const eventContent = (
                    <>
                      <span className="flex min-w-0 items-center">
                        <span
                          className={`mr-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${EVENT_TYPE_COLORS[ev.event_type] ?? "bg-white/40"}`}
                        />
                        <span className="truncate">{ev.title}</span>
                      </span>
                      {hadirCount > 0 && (
                        <span className="mt-0.5 block text-[9px] leading-none text-green-400/70">
                          {hadirCount} hadir{tentativeCount > 0 ? ` · ${tentativeCount}?` : ""}
                        </span>
                      )}
                    </>
                  );

                  // Use override href if provided (e.g. cross-team "Semua Tim" view)
                  const overrideHref = eventHrefs?.[ev.id];

                  if (readOnly && !overrideHref) {
                    return (
                      <div
                        key={ev.id}
                        className="block rounded px-1 py-0.5 text-[10px] leading-tight text-ui-text"
                      >
                        {eventContent}
                      </div>
                    );
                  }

                  let eventHref = overrideHref ?? `/${orgSlug}/calendar/${ev.id}`;
                  if (!overrideHref) {
                    const isScrim = ev.event_type === "scrim" || ev.ref_type === "scrim";
                    const isTournament = ev.event_type === "tournament" || ev.ref_type === "tournament";
                    if (isScrim) {
                      eventHref = `/${orgSlug}/scrim/${ev.ref_id || ev.id.replace("scrim-", "")}`;
                    } else if (isTournament) {
                      eventHref = `/${orgSlug}/tournaments/${ev.ref_id || ev.id.replace("tournament-", "")}`;
                    }
                  }

                  return (
                    <Link
                      key={ev.id}
                      href={eventHref}
                      onClick={(e) => e.stopPropagation()}
                      className="block rounded px-1 py-0.5 text-[10px] leading-tight text-ui-text transition hover:bg-ui-hover"
                    >
                      {eventContent}
                    </Link>
                  );
                })}
                {dayEvents.length > 3 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setExpandedDay(day); }}
                    className="block w-full cursor-pointer rounded px-1 text-left text-[10px] text-ui-text-muted transition hover:bg-ui-hover hover:text-ui-text"
                  >
                    +{dayEvents.length - 3} lagi
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day events popup */}
      {expandedDay !== null && (() => {
        const popupEvents = eventsByDay.get(expandedDay) ?? [];
        const label = new Date(year, month, expandedDay).toLocaleDateString("id-ID", {
          weekday: "long", day: "numeric", month: "long",
        });
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setExpandedDay(null)}
          >
            <div
              className="w-full max-w-sm rounded-xl border border-ui-border bg-ui-surface shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-ui-border px-4 py-3">
                <span className="text-sm font-semibold capitalize text-ui-text">{label}</span>
                <button
                  type="button"
                  onClick={() => setExpandedDay(null)}
                  className="cursor-pointer text-ui-text-muted transition hover:text-ui-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto py-2">
                {popupEvents.map((ev) => {
                  const dot = (
                    <span className={`mr-2 inline-block h-2 w-2 shrink-0 rounded-full ${EVENT_TYPE_COLORS[ev.event_type] ?? "bg-white/40"}`} />
                  );
                  const time = new Date(new Date(ev.starts_at).getTime() + 7 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(11, 16);

                  const overrideHref = eventHrefs?.[ev.id];

                  if (readOnly && !overrideHref) {
                    return (
                      <div key={ev.id} className="flex items-center gap-2 px-4 py-2 text-sm text-ui-text">
                        {dot}
                        <span className="flex-1 truncate">{ev.title}</span>
                        <span className="shrink-0 text-xs text-ui-text-muted">{time}</span>
                      </div>
                    );
                  }

                  let href = overrideHref ?? `/${orgSlug}/calendar/${ev.id}`;
                  if (!overrideHref) {
                    if (ev.event_type === "scrim" || ev.ref_type === "scrim") {
                      href = `/${orgSlug}/scrim/${ev.ref_id || ev.id.replace("scrim-", "")}`;
                    } else if (ev.event_type === "tournament" || ev.ref_type === "tournament") {
                      href = `/${orgSlug}/tournaments/${ev.ref_id || ev.id.replace("tournament-", "")}`;
                    }
                  }

                  return (
                    <Link
                      key={ev.id}
                      href={href}
                      onClick={() => setExpandedDay(null)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-ui-text transition hover:bg-ui-elevated"
                    >
                      {dot}
                      <span className="flex-1 truncate">{ev.title}</span>
                      <span className="shrink-0 text-xs text-ui-text-muted">{time}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
export { CalendarGrid };
