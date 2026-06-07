"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Swords, Calendar, Clock, Trophy } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { PublicTournament, PublicScrim } from "@/features/admin/queries";

export interface HeroSlide {
  image: string;
  achievement: string;
  rank: string;
  year: string;
}

export interface HeroSettings {
  hero_eyebrow: string;
  hero_tagline: string;
  hero_cta_label: string;
  hero_cta_href: string;
}

interface HeroSectionProps {
  slides?: HeroSlide[];
  settings?: HeroSettings;
  featuredTournaments?: unknown[];
  heroBackground?: string | null;
  nearestScrim: PublicScrim | null;
  upcomingMatches: PublicTournament[];
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

function formatScrimDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }) + " WIB";
}

function formatMatchDate(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr + "T00:00:00");
  const d = date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
  return timeStr ? `${d} · ${timeStr.slice(0, 5)}` : d;
}

const HeroSection = ({
  heroBackground,
  nearestScrim,
  upcomingMatches = [],
}: HeroSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const target = useMemo(() => nearestScrim ? new Date(nearestScrim.scheduled_at) : null, [nearestScrim]);
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    if (!target) return;
    setParts(diffParts(target));
    const id = setInterval(() => setParts(diffParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  useGSAP(() => {
    gsap.from(".hero-card-left", { x: -30, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.15 });
    gsap.from(".hero-card-right", { x: 30, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.25 });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#020202] pt-24 pb-16">
      {/* Grid line pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Background glow effects behind the card */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-12 right-1/4 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none z-0" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 flex flex-col justify-center flex-1">
        {/* The outer border wrapper with clip-path */}
        <div className="p-[1px] bg-gradient-to-br from-white/15 via-white/5 to-transparent clip-hero-card">
          
          {/* The inner container */}
          <div className="relative bg-[#070707]/75 backdrop-blur-xl clip-hero-card min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex flex-col justify-center overflow-hidden p-6 sm:p-10 lg:p-14">
            
            {/* Background Image of Hero (inside the card) */}
            {heroBackground && (
              <div className="absolute inset-0 z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroBackground}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                  style={{ opacity: 0.08, filter: "grayscale(80%) brightness(0.35)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-transparent opacity-90" />
              </div>
            )}

            {/* Content row */}
            <div className="relative z-10 flex flex-col lg:flex-row items-stretch justify-between gap-10 lg:gap-14">
              
              {/* Left Column: Scrim Countdown */}
              <div className="hero-card-left flex-1 flex flex-col justify-center border-b border-white/5 pb-8 lg:border-b-0 lg:pb-0 lg:border-r lg:border-white/5 lg:pr-14">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#D4FF00] mb-4">
                  <Swords className="h-4 w-4" />
                  Scrim Terdekat
                </div>

                {nearestScrim ? (
                  <>
                    <h2 className="font-bebas text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.9] text-white tracking-wide">
                      vs {nearestScrim.opponent_name}
                    </h2>
                    
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm font-semibold font-orbitron text-white/55">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-[#D4FF00] opacity-80" />
                        {formatScrimDate(nearestScrim.scheduled_at)}
                      </span>
                    </div>

                    {/* Countdown Ticking widget */}
                    <div className="mt-8 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-[#D4FF00] opacity-80" />
                      {parts === null ? (
                        <div className="flex gap-4 font-bebas text-white">
                          <CountdownCell value={0} label="hari" />
                          <span className="text-white/20 text-3xl font-light">:</span>
                          <CountdownCell value={0} label="jam" />
                          <span className="text-white/20 text-3xl font-light">:</span>
                          <CountdownCell value={0} label="menit" />
                          <span className="text-white/20 text-3xl font-light">:</span>
                          <CountdownCell value={0} label="detik" />
                        </div>
                      ) : parts.pastDue ? (
                        <span className="font-orbitron text-sm font-bold uppercase tracking-wider text-emerald-400">
                          Sedang Berlangsung
                        </span>
                      ) : (
                        <div className="flex gap-4 font-bebas text-white">
                          <CountdownCell value={parts.days} label="hari" />
                          <span className="text-white/20 text-3xl font-light self-start mt-1">:</span>
                          <CountdownCell value={parts.hours} label="jam" />
                          <span className="text-white/20 text-3xl font-light self-start mt-1">:</span>
                          <CountdownCell value={parts.minutes} label="menit" />
                          <span className="text-white/20 text-3xl font-light self-start mt-1">:</span>
                          <CountdownCell value={parts.seconds} label="detik" />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-start py-8 text-white/35">
                    <Swords className="h-8 w-8 text-white/15 mb-3 animate-pulse" />
                    <span className="font-bebas text-2xl uppercase tracking-wider text-white/55">Belum Ada Scrim Terdekat</span>
                    <p className="text-xs mt-1 max-w-xs leading-relaxed text-[#6B6A68]">
                      Tidak ada jadwal scrim terdekat yang dijadwalkan. Silakan cek kembali nanti.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Upcoming Matches (3 Cards) */}
              <div className="hero-card-right w-full lg:w-[48%] flex flex-col justify-center">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#D4FF00]">
                    <Trophy className="h-4 w-4" />
                    Upcoming Matches
                  </div>
                  <Link
                    href="/schedule"
                    className="font-orbitron text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors duration-200"
                  >
                    View All →
                  </Link>
                </div>

                <div className="space-y-3">
                  {upcomingMatches.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="group flex items-center justify-between gap-4 border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-[#D4FF00]/40 hover:bg-white/[0.04] clip-cyber-btn"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-orbitron text-[9px] font-bold text-[#D4FF00]">
                            {formatMatchDate(m.start_date, m.start_time)}
                          </span>
                          {m.game && (
                            <span className="font-orbitron text-[8px] font-bold uppercase bg-[#D4FF00]/10 text-[#D4FF00] px-1.5 py-0.5 rounded">
                              {m.game}
                            </span>
                          )}
                        </div>
                        <h4 className="mt-1 font-bebas text-lg font-bold uppercase tracking-wide text-white truncate group-hover:text-[#D4FF00] transition-colors duration-200">
                          {m.name}
                        </h4>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/40 font-semibold font-orbitron">
                          {m.division_name && <span>{m.division_name}</span>}
                          {m.organizer && (
                            <>
                              <span>·</span>
                              <span>{m.organizer}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {upcomingMatches.length === 0 && (
                    <div className="flex flex-col items-center justify-center border border-dashed border-white/5 py-12 text-center rounded">
                      <Trophy className="h-6 w-6 text-white/10 mb-2" />
                      <p className="font-bebas text-sm uppercase tracking-wider text-white/40">No Matches Scheduled</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Neon/Gold bottom divider line */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] overflow-hidden">
        <div className="h-full w-[108%] bg-[#D4FF00] opacity-80" style={{ marginLeft: "-4%", transform: "skewX(-8deg)" }} />
      </div>
    </section>
  );
};

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl sm:text-5xl font-black tracking-tight text-white tabular-nums leading-none">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="font-orbitron text-[8px] sm:text-[9px] uppercase tracking-wider text-white/40 mt-1 font-bold">
        {label}
      </span>
    </div>
  );
}

export { HeroSection };
