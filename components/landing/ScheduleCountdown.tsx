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
    <div className="flex flex-col items-center text-center">
      <div className="inline-flex flex-col items-center justify-center bg-[#071428]/35 backdrop-blur-md rounded-3xl border border-white/5 p-6 px-8 sm:px-12 relative overflow-hidden transition-all duration-500 hover:border-white/10 group w-full max-w-md sm:max-w-lg">
        
        <p className="relative z-10 mb-4 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 group-hover:text-white/60 transition-colors">
          Countdown — {tournament.name}
        </p>
        
        <div className="relative z-10 flex items-center gap-3 sm:gap-5 justify-center">
          <div className="flex flex-col items-center">
            <span className="font-bebas text-5xl sm:text-6xl font-black text-white tracking-wide">{pad(timeLeft.days)}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#9B9A97]/60 mt-1">Hari</span>
          </div>
          <span className="font-bebas text-3xl sm:text-4xl font-black text-[#F5C400]/50 self-start mt-2 sm:mt-3 animate-pulse">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bebas text-5xl sm:text-6xl font-black text-white tracking-wide">{pad(timeLeft.hours)}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#9B9A97]/60 mt-1">Jam</span>
          </div>
          <span className="font-bebas text-3xl sm:text-4xl font-black text-[#F5C400]/50 self-start mt-2 sm:mt-3 animate-pulse">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bebas text-5xl sm:text-6xl font-black text-white tracking-wide">{pad(timeLeft.minutes)}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#9B9A97]/60 mt-1">Menit</span>
          </div>
          <span className="font-bebas text-3xl sm:text-4xl font-black text-[#F5C400]/50 self-start mt-2 sm:mt-3 animate-pulse">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bebas text-5xl sm:text-6xl font-black text-white tracking-wide">{pad(timeLeft.seconds)}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#9B9A97]/60 mt-1">Detik</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export { ScheduleCountdown };
