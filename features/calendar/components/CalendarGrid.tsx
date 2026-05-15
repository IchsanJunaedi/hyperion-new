"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { Database } from "@/types/database";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

interface CalendarGridProps {
  orgSlug: string;
  events: CalendarEvent[];
  year: number;
  month: number; // 0-indexed
}

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const EVENT_TYPE_COLORS: Record<string, string> = {
  scrim: "bg-blue-400",
  tournament: "bg-yellow-400",
  practice: "bg-green-400",
  meeting: "bg-purple-400",
  other: "bg-white/40",
};

export function CalendarGrid({ orgSlug, events, year, month }: CalendarGridProps) {
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
    const wibDate = new Date(
      eventDate.getTime() + 7 * 60 * 60 * 1000,
    );
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
    router.push(`/${orgSlug}/calendar?${params.toString()}`);
  }

  const today = new Date();
  const todayDay =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate()
      : -1;

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
      <div className="grid grid-cols-7 gap-px rounded-lg border border-white/5 bg-white/5 overflow-hidden">
        {/* Empty cells before first day */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] bg-zinc-950 p-1" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = eventsByDay.get(day) ?? [];
          const isToday = day === todayDay;

          return (
            <div
              key={day}
              className={`min-h-[80px] bg-zinc-950 p-1 transition hover:bg-zinc-900 ${
                isToday ? "ring-1 ring-inset ring-yellow-400/30" : ""
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-yellow-400 font-bold text-black"
                    : "text-white/70"
                }`}
              >
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/${orgSlug}/calendar/${ev.id}`}
                    className="block truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white/80 transition hover:bg-white/10"
                  >
                    <span
                      className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${EVENT_TYPE_COLORS[ev.event_type] ?? "bg-white/40"}`}
                    />
                    {ev.title}
                  </Link>
                ))}
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
