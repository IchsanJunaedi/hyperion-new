"use client";

import { useEffect, useMemo, useState } from "react";
import { computeTimeLeft, getTargetDate, type TimeLeft } from "@/lib/utils/countdown";
import type { PublicTournament } from "@/features/admin/queries";

interface Props {
  tournament: PublicTournament;
}

const pad = (n: number) => String(n).padStart(2, "0");

const ScheduleCountdown = ({ tournament }: Props) => {
  const target = useMemo(
    () => getTargetDate(tournament.start_date, tournament.start_time),
    [tournament.start_date, tournament.start_time]
  );
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null | "past">(null);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      const result = computeTimeLeft(target);
      setTimeLeft(result === null ? "past" : result);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [target]);

  if (timeLeft === null) return null;

  if (timeLeft === "past") {
    return (
      <p className="animate-pulse text-sm font-bold uppercase tracking-widest text-[#F5C400]">
        Sedang Berlangsung
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
        Countdown — {tournament.name}
      </p>
      <div
        className="flex items-baseline gap-1 font-black tabular-nums text-white"
        style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em", lineHeight: 1 }}
      >
        <span>{pad(timeLeft.days)}</span>
        <span className="text-[#F5C400]" style={{ opacity: 0.6 }}>·</span>
        <span>{pad(timeLeft.hours)}</span>
        <span className="text-[#F5C400]" style={{ opacity: 0.6 }}>·</span>
        <span>{pad(timeLeft.minutes)}</span>
        <span className="text-[#F5C400]" style={{ opacity: 0.6 }}>·</span>
        <span>{pad(timeLeft.seconds)}</span>
      </div>
      <div className="mt-1 flex items-center gap-6">
        {["Hari", "Jam", "Menit", "Detik"].map((label) => (
          <span key={label} className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/25">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};
export { ScheduleCountdown };
