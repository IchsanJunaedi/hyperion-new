"use client";

import { useEffect, useMemo, useState } from "react";
import { computeTimeLeft, getTargetDate, type TimeLeft } from "@/lib/utils/countdown";
import type { FeaturedTournament } from "@/features/admin/queries";

interface Props {
  tournaments: FeaturedTournament[];
}

const pad = (n: number) => String(n).padStart(2, "0");

const SingleCountdown = ({ tournament }: { tournament: FeaturedTournament }) => {
  const target = useMemo(
    () => getTargetDate(tournament.start_date, tournament.start_time),
    [tournament.start_date, tournament.start_time]
  );
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    let mounted = true;
    const tick = () => { if (!mounted) return; setTimeLeft(computeTimeLeft(target)); };
    tick();
    const id = setInterval(tick, 1000);
    return () => { mounted = false; clearInterval(id); };
  }, [target]);

  if (timeLeft === null) {
    return (
      <p className="animate-pulse font-black uppercase tracking-[0.2em] text-[#F5C400]" style={{ fontSize: "clamp(20px, 4vw, 42px)" }}>
        Sedang Berlangsung
      </p>
    );
  }

  return (
    <div className="flex items-baseline justify-center" style={{ lineHeight: 1, gap: 0 }}>
      <span className="countdown-num">{pad(timeLeft.days)}</span>
      <span className="countdown-dot">·</span>
      <span className="countdown-num">{pad(timeLeft.hours)}</span>
      <span className="countdown-dot">·</span>
      <span className="countdown-num">{pad(timeLeft.minutes)}</span>
      <span className="countdown-dot">·</span>
      <span className="countdown-num">{pad(timeLeft.seconds)}</span>
    </div>
  );
};

const CompactCountdown = ({ tournament }: { tournament: FeaturedTournament }) => {
  const target = useMemo(
    () => getTargetDate(tournament.start_date, tournament.start_time),
    [tournament.start_date, tournament.start_time]
  );
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    let mounted = true;
    const tick = () => { if (!mounted) return; setTimeLeft(computeTimeLeft(target)); };
    tick();
    const id = setInterval(tick, 1000);
    return () => { mounted = false; clearInterval(id); };
  }, [target]);

  if (timeLeft === null) {
    return (
      <p className="animate-pulse text-center text-xs font-bold uppercase tracking-[0.15em] text-[#F5C400]">
        Sedang Berlangsung
      </p>
    );
  }

  return (
    <div className="text-center font-black tabular-nums text-white" style={{ fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "-0.02em", lineHeight: 1 }}>
      {pad(timeLeft.days)}<span className="text-[#F5C400]" style={{ opacity: 0.7 }}>·</span>{pad(timeLeft.hours)}<span className="text-[#F5C400]" style={{ opacity: 0.7 }}>·</span>{pad(timeLeft.minutes)}<span className="text-[#F5C400]" style={{ opacity: 0.7 }}>·</span>{pad(timeLeft.seconds)}
    </div>
  );
};

const HeroCountdown = ({ tournaments }: Props) => {
  if (tournaments.length === 0) return null;

  // Single tournament — full editorial big numbers
  if (tournaments.length === 1) {
    const t = tournaments[0]!;
    return (
      <div className="text-center">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]" style={{ opacity: 0.85 }}>
          Next Tournament
        </p>
        <p className="mb-6 font-semibold text-white/90" style={{ fontSize: "clamp(13px, 2vw, 22px)", letterSpacing: "0.03em" }}>
          {t.name}
        </p>
        <SingleCountdown tournament={t} />
        <div className="mt-3 flex items-center justify-center">
          {(["Hari", "Jam", "Menit", "Detik"] as const).map((label, i) => (
            <span key={label} className="flex items-center">
              <span className="inline-block text-center text-[9px] font-semibold uppercase tracking-[0.25em] text-white/25" style={{ width: "clamp(60px, 10vw, 120px)" }}>
                {label}
              </span>
              {i < 3 && <span className="inline-block text-[9px] text-transparent" style={{ width: "clamp(12px, 2vw, 28px)" }}>·</span>}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Multiple tournaments — premium column grid
  return (
    <div className="w-full max-w-5xl">
      <p className="mb-8 text-center text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]" style={{ opacity: 0.85 }}>
        Upcoming Tournaments
      </p>

      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${Math.min(tournaments.length, 3)}, 1fr)` }}
      >
        {tournaments.slice(0, 3).map((t, i) => (
          <div key={t.id} className="relative flex flex-col items-center justify-center px-6 py-8">
            {/* Vertical divider */}
            {i > 0 && (
              <div className="absolute left-0 top-1/2 h-20 w-px -translate-y-1/2" style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.07), transparent)" }} />
            )}

            {/* Label */}
            <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">
              {i === 0 ? "Next" : `#${i + 1}`}
            </p>

            {/* Tournament name */}
            <p className="mb-5 line-clamp-2 text-center font-bold text-white/85" style={{ fontSize: "clamp(11px, 1.3vw, 17px)", letterSpacing: "0.02em" }}>
              {t.name}
            </p>

            {/* Compact countdown */}
            <CompactCountdown tournament={t} />

            {/* Unit labels */}
            <div className="mt-2 flex items-center justify-center gap-3">
              {["Hari", "Jam", "Mnt", "Dtk"].map((label) => (
                <span key={label} className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/20">
                  {label}
                </span>
              ))}
            </div>

            {/* Date */}
            <p className="mt-4 text-[9px] tracking-wider text-white/15">
              {t.start_date}{t.start_time ? ` · ${t.start_time.slice(0, 5)}` : ""}
            </p>
          </div>
        ))}
      </div>

      {tournaments.length > 3 && (
        <p className="mt-6 text-center text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">
          +{tournaments.length - 3} tournament lainnya
        </p>
      )}
    </div>
  );
};

export { HeroCountdown };
