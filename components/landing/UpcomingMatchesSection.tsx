"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  if (tournaments.length === 0) return null;

  return (
    <section className="bg-[#040D1C] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/12 pb-8"
        >
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
              05 — Schedule
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Upcoming Matches
            </h2>
          </div>
          <Link
            href="/schedule"
            className="text-[11px] font-bold uppercase tracking-widest text-[#F5C400] transition hover:text-[#F5C400]/70"
          >
            View schedule page →
          </Link>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tournaments.map((t, index) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
              className="group flex flex-col gap-3 border border-white/10 bg-[#071428] p-5 transition-all duration-200 hover:border-[#F5C400]/40 hover:bg-[#0C1E3C]"
            >
              {/* Date + game badge */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5C400]">
                  {formatCardDate(t.start_date, t.start_time)}
                </p>
                {t.game && (
                  <span className="shrink-0 rounded bg-[#F5C400]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F5C400]">
                    {t.game}
                  </span>
                )}
              </div>

              {/* Name */}
              <p className="font-black uppercase leading-tight tracking-tight text-white sm:text-lg">
                {t.name}
              </p>

              {/* Division + organizer */}
              <div className="flex flex-col gap-0.5">
                {t.division_name && (
                  <p className="text-xs text-white/45">{t.division_name}</p>
                )}
                {t.organizer && (
                  <p className="text-xs text-white/35">{t.organizer}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { UpcomingMatchesSection };
