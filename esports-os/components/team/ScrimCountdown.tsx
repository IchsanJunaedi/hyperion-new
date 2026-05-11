"use client";

import { Calendar, Clock, MapPin, Swords } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Database } from "@/types/database";

type Scrim = Database["public"]["Tables"]["scrims"]["Row"];

export interface ScrimCountdownProps {
  scrim: Scrim;
  orgSlug: string;
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  pastDue: boolean;
}

function diffParts(target: Date): CountdownParts {
  const ms = target.getTime() - Date.now();
  const pastDue = ms <= 0;
  const abs = Math.abs(ms);
  return {
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor((abs % 86_400_000) / 3_600_000),
    minutes: Math.floor((abs % 3_600_000) / 60_000),
    seconds: Math.floor((abs % 60_000) / 1000),
    pastDue,
  };
}

/**
 * Stable, locale-independent fallback rendered on the server and during
 * the first client render so SSR and hydration agree. Node ICU and
 * browser ICU produce subtly different `toLocaleString` output even
 * with an explicit timeZone, which causes a hydration warning. We swap
 * in the localized version inside `useEffect` once we're past hydration.
 */
function stableWibLabel(target: Date): string {
  const wib = new Date(target.getTime() + 7 * 60 * 60 * 1000);
  const dd = String(wib.getUTCDate()).padStart(2, "0");
  const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
  const hh = String(wib.getUTCHours()).padStart(2, "0");
  const mi = String(wib.getUTCMinutes()).padStart(2, "0");
  return `${dd}/${mm} · ${hh}:${mi} WIB`;
}

export function ScrimCountdown({ scrim, orgSlug }: ScrimCountdownProps) {
  const target = useMemo(
    () => new Date(scrim.scheduled_at),
    [scrim.scheduled_at],
  );
  const [parts, setParts] = useState<CountdownParts>(() => diffParts(target));
  const [formatted, setFormatted] = useState<string>(() =>
    stableWibLabel(target),
  );

  useEffect(() => {
    const id = setInterval(() => setParts(diffParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    // After hydration, swap in the locale-formatted version. Pin to
    // Asia/Jakarta so a user reading the page from another tz still
    // sees the canonical scrim time.
    setFormatted(
      target.toLocaleString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
    );
  }, [target]);

  return (
    <article className="rounded-xl border border-white/10 bg-gradient-to-br from-yellow-500/[0.08] to-transparent p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-yellow-400">
        <Swords className="h-3.5 w-3.5" />
        Scrim berikutnya
      </div>

      <h3 className="mt-3 text-xl font-bold text-white sm:text-2xl">
        vs {scrim.opponent_name}
      </h3>
      <p className="mt-1 text-xs uppercase tracking-wide text-white/55">
        {scrim.format} · {scrim.status}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-white/55" />
          {formatted}
        </span>
        {scrim.server_region ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-white/55" />
            {scrim.server_region}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Clock className="h-4 w-4 text-white/55" />
        {parts.pastDue ? (
          <span className="text-sm text-white/70">
            Sedang berlangsung — telat
            {parts.days > 0 ? ` ${parts.days}h` : ""} {parts.hours}j{" "}
            {parts.minutes}m
          </span>
        ) : (
          <div className="flex gap-2 text-sm tabular-nums">
            <CountdownCell value={parts.days} label="hari" />
            <span className="text-white/35">:</span>
            <CountdownCell value={parts.hours} label="jam" />
            <span className="text-white/35">:</span>
            <CountdownCell value={parts.minutes} label="menit" />
            <span className="text-white/35">:</span>
            <CountdownCell value={parts.seconds} label="detik" />
          </div>
        )}
      </div>

      <Link
        href={`/${orgSlug}/scrim/${scrim.id}`}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
      >
        Konfirmasi kehadiran
      </Link>
    </article>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="text-lg font-bold text-white">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-white/45">
        {label}
      </span>
    </span>
  );
}
