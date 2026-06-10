"use client";

import { Calendar, Clock, MapPin, Swords, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import type { Database } from "@/types/database";
import { updateAttendanceAction } from "@/features/scrim/actions";

type Scrim = Database["public"]["Tables"]["scrims"]["Row"];

export interface ScrimCountdownProps {
  scrim: Scrim;
  orgSlug: string;
  myAttendanceStatus?: string;
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

function stableWibLabel(target: Date): string {
  const wib = new Date(target.getTime() + 7 * 60 * 60 * 1000);
  const dd = String(wib.getUTCDate()).padStart(2, "0");
  const mm = String(wib.getUTCMonth() + 1).padStart(2, "0");
  const hh = String(wib.getUTCHours()).padStart(2, "0");
  const mi = String(wib.getUTCMinutes()).padStart(2, "0");
  return `${dd}/${mm} · ${hh}:${mi} WIB`;
}

const ScrimCountdown = ({ scrim, orgSlug, myAttendanceStatus }: ScrimCountdownProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const target = useMemo(
    () => new Date(scrim.scheduled_at),
    [scrim.scheduled_at],
  );

  const [parts, setParts] = useState<CountdownParts | null>(null);
  const [formatted, setFormatted] = useState<string>(() =>
    stableWibLabel(target),
  );

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
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
    );
  }, [target]);

  const handleQuickRSVP = () => {
    if (pending || myAttendanceStatus === "confirmed") return;
    setError(null);
    startTransition(async () => {
      const res = await updateAttendanceAction(orgSlug, {
        scrim_id: scrim.id,
        status: "confirmed",
      });
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  const renderRsvpButton = () => {
    // If we're on a view that has access to myAttendanceStatus (like detail page)
    if (myAttendanceStatus !== undefined) {
      if (myAttendanceStatus === "confirmed") {
        return (
          <div className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 text-sm font-semibold text-emerald-400">
            <Check className="h-4 w-4" />
            Sudah Konfirmasi Hadir
          </div>
        );
      }

      return (
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={handleQuickRSVP}
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-yellow-400 px-5 text-sm font-bold text-black transition-all hover:bg-yellow-300 disabled:opacity-60 cursor-pointer shadow-lg shadow-yellow-400/10"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Konfirmasi kehadiran
          </button>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
      );
    }

    // Default Link (for widgets on dashboard/landing page)
    return (
      <Link
        href={`/${orgSlug}/scrim/${scrim.id}`}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-yellow-400 px-5 text-sm font-bold text-black transition-all hover:bg-yellow-300 shadow-lg shadow-yellow-400/10"
      >
        Konfirmasi kehadiran
      </Link>
    );
  };

  return (
    <article className="rounded-xl border border-white/10 bg-gradient-to-br from-yellow-500/[0.08] to-transparent p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-yellow-400">
        <Swords className="h-3.5 w-3.5" />
        Scrim berikutnya
      </div>

      <h3 className="mt-3 text-xl font-bold text-ui-text sm:text-2xl">
        vs {scrim.opponent_name}
      </h3>
      <p className="mt-1 text-xs uppercase tracking-wide text-ui-text-2">
        {scrim.format} · {scrim.status}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ui-text">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-ui-text-2" />
          {formatted}
        </span>
        {scrim.server_region ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-ui-text-2" />
            {scrim.server_region}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Clock className="h-4 w-4 text-ui-text-2" />
        {parts === null ? (
          <div className="flex gap-2 text-sm tabular-nums">
            <CountdownCell value={0} label="hari" />
            <span className="text-ui-text-muted">:</span>
            <CountdownCell value={0} label="jam" />
            <span className="text-ui-text-muted">:</span>
            <CountdownCell value={0} label="menit" />
            <span className="text-ui-text-muted">:</span>
            <CountdownCell value={0} label="detik" />
          </div>
        ) : parts.pastDue ? (
          <span className="text-sm text-ui-text">
            Sedang berlangsung — telat
            {parts.days > 0 ? ` ${parts.days}h` : ""} {parts.hours}j{" "}
            {parts.minutes}m
          </span>
        ) : (
          <div className="flex gap-2 text-sm tabular-nums">
            <CountdownCell value={parts.days} label="hari" />
            <span className="text-ui-text-muted">:</span>
            <CountdownCell value={parts.hours} label="jam" />
            <span className="text-ui-text-muted">:</span>
            <CountdownCell value={parts.minutes} label="menit" />
            <span className="text-ui-text-muted">:</span>
            <CountdownCell value={parts.seconds} label="detik" />
          </div>
        )}
      </div>

      {renderRsvpButton()}
    </article>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="text-lg font-bold text-ui-text">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-ui-text-2">
        {label}
      </span>
    </span>
  );
};
export { ScrimCountdown };
