"use client";

import { useEffect, useMemo, useState } from "react";
import { computeTimeLeft, getTargetDate, type TimeLeft } from "@/lib/utils/countdown";

interface Props {
  tournament: {
    name: string;
    start_date: string;
    start_time: string | null;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

const HeroCountdown = ({ tournament }: Props) => {
  // useMemo so a stable Date reference doesn't retrigger the effect on every render
  const target = useMemo(
    () => getTargetDate(tournament.start_date, tournament.start_time),
    [tournament.start_date, tournament.start_time]
  );
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    computeTimeLeft(target)
  );

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setTimeLeft(computeTimeLeft(target));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [target]);

  return (
    <div className="text-center">
      {/* Tournament label */}
      <p
        className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]"
        style={{ opacity: 0.85 }}
      >
        Next Tournament
      </p>

      {/* Tournament name */}
      <p
        className="mb-6 font-semibold text-white/90"
        style={{ fontSize: "clamp(13px, 2vw, 22px)", letterSpacing: "0.03em" }}
      >
        {tournament.name}
      </p>

      {timeLeft === null ? (
        /* SEDANG BERLANGSUNG */
        <p
          className="animate-pulse font-black uppercase tracking-[0.2em] text-[#F5C400]"
          style={{ fontSize: "clamp(20px, 4vw, 42px)" }}
        >
          Sedang Berlangsung
        </p>
      ) : (
        <>
          {/* Big countdown numbers */}
          <div
            className="flex items-baseline justify-center"
            style={{ lineHeight: 1, gap: 0 }}
          >
            <span className="countdown-num">{pad(timeLeft.days)}</span>
            <span className="countdown-dot">·</span>
            <span className="countdown-num">{pad(timeLeft.hours)}</span>
            <span className="countdown-dot">·</span>
            <span className="countdown-num">{pad(timeLeft.minutes)}</span>
            <span className="countdown-dot">·</span>
            <span className="countdown-num">{pad(timeLeft.seconds)}</span>
          </div>

          {/* Unit labels — match widths to numbers above */}
          <div className="mt-2 flex items-center justify-center">
            {(["Hari", "Jam", "Menit", "Detik"] as const).map((label, i) => (
              <span key={label} className="flex items-center">
                <span
                  className="inline-block text-center text-[9px] font-semibold uppercase tracking-[0.25em] text-white/25"
                  style={{ width: "clamp(60px, 10vw, 120px)" }}
                >
                  {label}
                </span>
                {i < 3 && (
                  <span
                    className="inline-block text-[9px] text-transparent"
                    style={{ width: "clamp(12px, 2vw, 28px)" }}
                  >
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export { HeroCountdown };
