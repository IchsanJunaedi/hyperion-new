"use client";

import { ChevronLeft, ChevronRight, Copy, Check, Swords, Trophy, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { CalendarEvent } from "../queries";

const WIB = "Asia/Jakarta";

const EVENT_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scrim:      { bg: "bg-purple-500/15 border-purple-500/30", text: "text-purple-300", label: "Scrim" },
  tournament: { bg: "bg-yellow-500/15 border-yellow-500/30", text: "text-yellow-300", label: "Turnamen" },
  practice:   { bg: "bg-green-500/15 border-green-500/30",  text: "text-green-300",  label: "Latihan" },
  meeting:    { bg: "bg-blue-500/15 border-blue-500/30",    text: "text-blue-300",   label: "Meeting" },
  bootcamp:   { bg: "bg-orange-500/15 border-orange-500/30", text: "text-orange-300", label: "Bootcamp" },
  other:      { bg: "bg-white/5 border-white/10",           text: "text-white/60",   label: "Event" },
};

function getEventTypeIcon(type: string) {
  if (type === "scrim") return <Swords className="h-3 w-3" />;
  if (type === "tournament") return <Trophy className="h-3 w-3" />;
  return <Calendar className="h-3 w-3" />;
}

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Mon=1 … Sun=0
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toWibDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("id-ID", { timeZone: WIB, year: "numeric", month: "2-digit", day: "2-digit" });
}

function toWibTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("id-ID", { timeZone: WIB, hour: "2-digit", minute: "2-digit" });
}

const DAYS_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const DAYS_FULL_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

interface CalendarWeeklyWarRoomProps {
  orgSlug: string;
  events: CalendarEvent[];
  initialWeekOffset?: number;
}

const CalendarWeeklyWarRoom = ({ orgSlug, events }: CalendarWeeklyWarRoomProps) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [copied, setCopied] = useState(false);

  const today = new Date();
  const baseMonday = getWeekStart(today);
  const monday = new Date(baseMonday);
  monday.setDate(monday.getDate() + weekOffset * 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const weekLabel = (() => {
    const start = weekDays[0]!.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const end = weekDays[6]!.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    return `${start} – ${end}`;
  })();

  function getEventsForDay(day: Date): CalendarEvent[] {
    const dayStr = day.toLocaleDateString("id-ID", { timeZone: WIB, year: "numeric", month: "2-digit", day: "2-digit" });
    return events.filter((e) => {
      const eDate = toWibDate(e.starts_at);
      return eDate === dayStr;
    }).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }

  function getEventLink(e: CalendarEvent): string {
    if (e.ref_type === "scrim" && e.ref_id) return `/${orgSlug}/scrim/${e.ref_id}`;
    if (e.ref_type === "tournament" && e.ref_id) return `/${orgSlug}/tournaments/${e.ref_id}`;
    return `/${orgSlug}/calendar/${e.id}`;
  }

  function buildWaText(): string {
    const lines: string[] = [`*Jadwal Tim — ${weekLabel}*`, ""];
    let hasEvent = false;
    weekDays.forEach((day, i) => {
      const dayEvents = getEventsForDay(day);
      if (dayEvents.length === 0) return;
      hasEvent = true;
      const dayName = DAYS_FULL_ID[i] ?? "";
      const dateStr = day.toLocaleDateString("id-ID", { day: "numeric", month: "long" });
      lines.push(`📅 *${dayName}, ${dateStr}*`);
      dayEvents.forEach((e) => {
        const style = EVENT_TYPE_STYLES[e.event_type] ?? EVENT_TYPE_STYLES.other!;
        const time = e.is_all_day ? "Seharian" : toWibTime(e.starts_at);
        const typeLabel = style.label;
        lines.push(`  • [${typeLabel}] ${e.title} — ${time} WIB`);
      });
      lines.push("");
    });
    if (!hasEvent) lines.push("Tidak ada jadwal minggu ini.");
    return lines.join("\n");
  }

  function handleCopyWa() {
    const text = buildWaText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isCurrentWeek = weekOffset === 0;
  const todayStr = today.toLocaleDateString("id-ID", { timeZone: WIB, year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((v) => v - 1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-white/10 text-white/50 hover:bg-white/5 hover:text-ui-text transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-ui-text min-w-[160px] text-center">{weekLabel}</span>
          <button
            type="button"
            onClick={() => setWeekOffset((v) => v + 1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-white/10 text-white/50 hover:bg-white/5 hover:text-ui-text transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="text-xs text-white/40 hover:text-white/70 transition"
            >
              Hari ini
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopyWa}
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 text-xs font-semibold text-green-400 transition hover:bg-green-500/20 cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Tersalin!" : "Copy ke WA"}
        </button>
      </div>

      {/* Week grid — 7 columns */}
      <div className="grid grid-cols-7 gap-1.5 min-h-[240px]">
        {weekDays.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const dayStr = day.toLocaleDateString("id-ID", { timeZone: WIB, year: "numeric", month: "2-digit", day: "2-digit" });
          const isToday = dayStr === todayStr;
          const isWeekend = i >= 5;

          return (
            <div
              key={i}
              className={cn(
                "flex flex-col rounded-xl border p-2 transition",
                isToday
                  ? "border-yellow-400/40 bg-yellow-400/5"
                  : isWeekend
                  ? "border-white/5 bg-zinc-900/20"
                  : "border-white/8 bg-zinc-900/30",
              )}
            >
              {/* Day header */}
              <div className="mb-2 text-center">
                <p className={cn("text-[10px] font-semibold uppercase tracking-wide", isToday ? "text-yellow-400" : "text-white/40")}>
                  {DAYS_ID[i]}
                </p>
                <p className={cn("text-sm font-bold leading-tight", isToday ? "text-yellow-400" : "text-white/70")}>
                  {day.getDate()}
                </p>
              </div>

              {/* Events */}
              <div className="flex flex-col gap-1 flex-1">
                {dayEvents.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center">
                    <span className="text-[9px] text-white/15">—</span>
                  </div>
                ) : (
                  dayEvents.map((e) => {
                    const style = EVENT_TYPE_STYLES[e.event_type] ?? EVENT_TYPE_STYLES.other!;
                    return (
                      <Link
                        key={e.id}
                        href={getEventLink(e)}
                        className={cn(
                          "group rounded-md border px-1.5 py-1 transition hover:brightness-125",
                          style.bg,
                        )}
                      >
                        <div className={cn("flex items-center gap-1", style.text)}>
                          {getEventTypeIcon(e.event_type)}
                          <span className="text-[9px] font-semibold truncate leading-tight">
                            {e.title}
                          </span>
                        </div>
                        {!e.is_all_day && (
                          <p className="mt-0.5 text-[8px] text-white/40">
                            {toWibTime(e.starts_at)}
                          </p>
                        )}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {Object.entries(EVENT_TYPE_STYLES).map(([type, s]) => (
          <span key={type} className={cn("inline-flex items-center gap-1 text-[10px]", s.text)}>
            {getEventTypeIcon(type)}
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};
export { CalendarWeeklyWarRoom };
