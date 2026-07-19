"use client";

import { Calendar, Clock, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface TournamentCountdownProps {
  name: string;
  startDate: string;
  startTime?: string | null;
  prizePool: string | null;
  organizer: string | null;
  /** ISO string — jika ada dan status upcoming, tampilkan countdown ke deadline */
  registrationDeadline?: string | null;
  /** "upcoming" = belum daftar, "ongoing" = sudah daftar */
  status?: string;
  /** Active match info untuk tournament ongoing */
  activeMatch?: {
    roundLabel: string;
    opponentName: string | null;
    matchFormat: string | null;
    scheduledAt: string | null;
  } | null;
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

const TournamentCountdown = ({
  name,
  startDate,
  startTime,
  prizePool,
  organizer,
  registrationDeadline,
  status,
  activeMatch,
}: TournamentCountdownProps) => {
  // Show reg deadline countdown when: upcoming + deadline exists + deadline hasn't passed
  const showRegDeadline =
    status === "upcoming" &&
    !!registrationDeadline &&
    new Date(registrationDeadline).getTime() > Date.now();

  const matchTarget = useMemo(() => {
    const timeStr = startTime ? startTime.slice(0, 5) : "00:00";
    return new Date(`${startDate}T${timeStr}:00+07:00`);
  }, [startDate, startTime]);

  const regTarget = useMemo(() => {
    if (!registrationDeadline) return null;
    return new Date(registrationDeadline);
  }, [registrationDeadline]);

  const activeTarget = showRegDeadline && regTarget ? regTarget : matchTarget;

  const [parts, setParts] = useState<CountdownParts | null>(null);
  const [formattedMatch, setFormattedMatch] = useState("");
  const [formattedReg, setFormattedReg] = useState("");

  useEffect(() => {
    setParts(diffParts(activeTarget));
    const id = setInterval(() => setParts(diffParts(activeTarget)), 1000);
    return () => clearInterval(id);
  }, [activeTarget]);

  useEffect(() => {
    setFormattedMatch(
      matchTarget.toLocaleString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }),
    );
  }, [matchTarget]);

  useEffect(() => {
    if (!regTarget) return;
    setFormattedReg(
      regTarget.toLocaleString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
    );
  }, [regTarget]);

  const isPast = parts?.pastDue ?? false;

  if (showRegDeadline) {
    return (
      <article className="rounded-xl border border-orange-500/25 bg-gradient-to-br from-orange-500/[0.08] to-transparent p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-orange-400">
          <Clock className="h-3.5 w-3.5" />
          Batas Pendaftaran
        </div>

        <h3 className="mt-3 text-xl font-bold text-ui-text sm:text-2xl">{name}</h3>
        {organizer && (
          <p className="mt-1 text-xs uppercase tracking-wide text-ui-text-2">{organizer}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ui-text">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-white" />
            Tutup: {formattedReg}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-white" />
            Mulai: {formattedMatch}
          </span>
          {prizePool && (
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-yellow-400" />
              Rp {prizePool}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-400/60" />
          {parts === null ? (
            <div className="flex gap-2 text-sm tabular-nums">
              <CountdownCell value={0} label="hari" color="text-orange-300" />
              <span className="text-ui-text-muted">:</span>
              <CountdownCell value={0} label="jam" color="text-orange-300" />
              <span className="text-ui-text-muted">:</span>
              <CountdownCell value={0} label="menit" color="text-orange-300" />
              <span className="text-ui-text-muted">:</span>
              <CountdownCell value={0} label="detik" color="text-orange-300" />
            </div>
          ) : isPast ? (
            <span className="text-sm font-medium text-orange-400">Pendaftaran ditutup</span>
          ) : (
            <div className="flex gap-2 text-sm tabular-nums">
              <CountdownCell value={parts.days} label="hari" color="text-orange-300" />
              <span className="text-ui-text-muted">:</span>
              <CountdownCell value={parts.hours} label="jam" color="text-orange-300" />
              <span className="text-ui-text-muted">:</span>
              <CountdownCell value={parts.minutes} label="menit" color="text-orange-300" />
              <span className="text-ui-text-muted">:</span>
              <CountdownCell value={parts.seconds} label="detik" color="text-orange-300" />
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-ui-border bg-gradient-to-br from-yellow-500/[0.08] to-transparent p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-yellow-400">
        <Trophy className="h-3.5 w-3.5" />
        {isPast ? "Turnamen sedang berlangsung" : "Turnamen berikutnya"}
      </div>

      <h3 className="mt-3 text-xl font-bold text-ui-text sm:text-2xl">{name}</h3>
      <p className="mt-1 text-xs uppercase tracking-wide text-ui-text-2">{organizer ?? "—"}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ui-text">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-white" />
          {formattedMatch}
        </span>
        {prizePool && (
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
            Rp {prizePool}
          </span>
        )}
      </div>

      {/* Active match info — shown when ongoing */}
      {activeMatch && status === "ongoing" && (
        <div className="mt-3 rounded-lg border border-yellow-400/15 bg-yellow-400/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-yellow-400/70 font-semibold mb-0.5">Match sedang berlangsung</p>
          <p className="text-sm font-medium text-ui-text">
            {activeMatch.roundLabel}
            {activeMatch.opponentName && <span className="text-ui-text-muted"> vs {activeMatch.opponentName}</span>}
            {activeMatch.matchFormat && (
              <span className="ml-1.5 rounded px-1 py-0.5 text-[9px] font-bold border border-yellow-400/20 text-yellow-400/80 bg-yellow-400/5">
                {activeMatch.matchFormat}
              </span>
            )}
          </p>
          {activeMatch.scheduledAt && (
            <p className="text-[11px] text-ui-text-muted mt-0.5">
              Jadwal: {new Date(activeMatch.scheduledAt).toLocaleString("id-ID", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                timeZone: "Asia/Jakarta"
              })} WIB
            </p>
          )}
        </div>
      )}

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
        ) : isPast ? (
          <span className="text-sm font-medium text-yellow-400">Sedang berlangsung</span>
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
    </article>
  );
};
export { TournamentCountdown };

function CountdownCell({
  value,
  label,
  color = "text-ui-text",
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <span className="flex flex-col items-center">
      <span className={`text-lg font-bold ${color}`}>
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-ui-text-2">{label}</span>
    </span>
  );
}
