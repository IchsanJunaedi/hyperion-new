"use client";

import { Calendar, Clock, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface TournamentCountdownProps {
  name: string;
  startDate: string;
  startTime?: string | null;
  prizePool: string | null;
  organizer: string | null;
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

export function TournamentCountdown({ name, startDate, startTime, prizePool, organizer }: TournamentCountdownProps) {
  const target = useMemo(() => {
    const timeStr = startTime || "00:00";
    return new Date(`${startDate}T${timeStr}:00+07:00`);
  }, [startDate, startTime]);
  const [parts, setParts] = useState<CountdownParts | null>(null);
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    setParts(diffParts(target));
    const id = setInterval(() => setParts(diffParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    setFormatted(
      target.toLocaleString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }),
    );
  }, [target]);

  const isPast = parts?.pastDue ?? false;

  return (
    <article className="rounded-xl border border-white/10 bg-gradient-to-br from-yellow-500/[0.08] to-transparent p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-yellow-400">
        <Trophy className="h-3.5 w-3.5" />
        {isPast ? "Turnamen sedang berlangsung" : "Turnamen berikutnya"}
      </div>

      <h3 className="mt-3 text-xl font-bold text-white sm:text-2xl">
        {name}
      </h3>
      <p className="mt-1 text-xs uppercase tracking-wide text-white/55">
        {organizer ?? "—"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-white/55" />
          {formatted}
        </span>
        {prizePool && (
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
            Rp {prizePool}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Clock className="h-4 w-4 text-white/55" />
        {parts === null ? (
          <div className="flex gap-2 text-sm tabular-nums">
            <CountdownCell value={0} label="hari" />
            <span className="text-white/35">:</span>
            <CountdownCell value={0} label="jam" />
            <span className="text-white/35">:</span>
            <CountdownCell value={0} label="menit" />
            <span className="text-white/35">:</span>
            <CountdownCell value={0} label="detik" />
          </div>
        ) : parts.pastDue ? (
          <span className="text-sm font-medium text-yellow-400">
            Sedang berlangsung
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
