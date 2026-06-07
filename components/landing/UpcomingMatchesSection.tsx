"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { PublicTournament } from "@/features/admin/queries";

interface Props {
  tournaments: PublicTournament[];
}

function formatCardDate(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr + "T00:00:00");
  const d = date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return timeStr ? `${d} · ${timeStr.slice(0, 5)}` : d;
}

const UpcomingMatchesSection = ({ tournaments }: Props) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".um-header", {
      y: 16, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
    gsap.from(".um-card", {
      y: 16, opacity: 0, duration: 0.45, stagger: 0.1, ease: "power2.out",
      scrollTrigger: { trigger: ".um-card", start: "top 88%", once: true },
    });
  }, { scope: sectionRef });

  if (tournaments.length === 0) return null;

  return (
    <section ref={sectionRef} className="bg-[#000000] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="um-header mb-8 flex flex-wrap items-end justify-between gap-4 pb-8">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="h-4 w-0.5 bg-[#F5C400]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                Upcoming Schedule
              </p>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Upcoming Matches
            </h2>
          </div>
          <Link
            href="/schedule"
            className="text-[11px] font-bold uppercase tracking-widest text-[#F5C400]/60 transition hover:text-[#F5C400]"
          >
            View schedule →
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="um-card group flex flex-col gap-3 border border-white/[0.1] bg-[#111111] p-5 transition-all duration-300 hover:border-[#F5C400]/50 hover:bg-[#161616]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5C400]">
                  {formatCardDate(t.start_date, t.start_time)}
                </p>
                {t.game && (
                  <span className="clip-tr shrink-0 border border-[#F5C400]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F5C400]/70">
                    {t.game}
                  </span>
                )}
              </div>
              <p className="font-black uppercase leading-tight tracking-tight text-white sm:text-lg">
                {t.name}
              </p>
              <div className="flex flex-col gap-0.5">
                {t.division_name && <p className="text-xs text-white/45">{t.division_name}</p>}
                {t.organizer && <p className="text-xs text-white/35">{t.organizer}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { UpcomingMatchesSection };
