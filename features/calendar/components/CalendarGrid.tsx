"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Database } from "@/types/database";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

interface CalendarGridProps {
  orgSlug: string;
  events: CalendarEvent[];
  year: number;
  month: number; // 0-indexed
  readOnly?: boolean;
  /** If true, clicking a date cell triggers onDayClick */
  canCreate?: boolean;
  /** Called when user clicks a day cell (when canCreate=true) */
  onDayClick?: (date: Date) => void;
}

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const EVENT_TYPE_COLORS: Record<string, string> = {
  scrim: "bg-blue-400",
  tournament: "bg-yellow-400",
  practice: "bg-green-400",
  meeting: "bg-purple-400",
  other: "bg-white/40",
};

export function CalendarGrid({
  orgSlug,
  events,
  year,
  month,
  readOnly = false,
  canCreate = false,
  onDayClick,
}: CalendarGridProps) {
  const router = useRouter();

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
    const params = new URLSearchParams();
    params.set("y", String(newDate.getFullYear()));
    params.set("m", String(newDate.getMonth()));
    const basePath = readOnly ? "/dashboard/calendar" : `/${orgSlug}/calendar`;
    router.push(`${basePath}?${params.toString()}`);
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
          className="rounded-md p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold capitalize text-white">
          {monthLabel}
        </h2>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="rounded-md p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-white/50">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-white/5 bg-white/5">
        {/* Empty cells before first day */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] bg-zinc-950 p-1" />
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
              className={`group relative min-h-[80px] bg-zinc-950 p-1 transition ${
                isToday ? "ring-1 ring-inset ring-yellow-400/30" : ""
              } ${isClickable ? "cursor-pointer hover:bg-zinc-900/80" : "hover:bg-zinc-900"}`}
            >
              {/* Day number + add button */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-yellow-400 font-bold text-black"
                      : "text-white/70"
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
                    className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded text-white/40 transition hover:bg-white/10 hover:text-white"
                    aria-label={`Tambah event pada ${day}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Events */}
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => {
                  const eventContent = (
                    <>
                      <span
                        className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${EVENT_TYPE_COLORS[ev.event_type] ?? "bg-white/40"}`}
                      />
                      {ev.title}
                    </>
                  );

                  if (readOnly) {
                    return (
                      <div
                        key={ev.id}
                        className="block truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white/80"
                      >
                        {eventContent}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={ev.id}
                      href={`/${orgSlug}/calendar/${ev.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white/80 transition hover:bg-white/10"
                    >
                      {eventContent}
                    </Link>
                  );
                })}
                {dayEvents.length > 3 && (
                  <span className="block px-1 text-[10px] text-white/40">
                    +{dayEvents.length - 3} lagi
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
