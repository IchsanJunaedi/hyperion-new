"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarRange, Zap } from "lucide-react";
import { toggleTournamentScheduleAction } from "@/features/admin/actions";
import type { AdminTournament } from "@/features/admin/queries";

interface Props {
  tournaments: AdminTournament[];
}

const TournamentsAdminClient = ({ tournaments: initial }: Props) => {
  const [tournaments, setTournaments] = useState(initial);
  const [pending, startTransition] = useTransition();

  const handleToggleSchedule = (id: string, currentlyActive: boolean) => {
    const nextValue = !currentlyActive;
    setTournaments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, show_on_schedule: nextValue } : t))
    );
    startTransition(async () => {
      const result = await toggleTournamentScheduleAction(id, nextValue);
      if (!result.ok) {
        toast.error(result.message);
        setTournaments((prev) =>
          prev.map((t) => (t.id === id ? { ...t, show_on_schedule: currentlyActive } : t))
        );
      } else {
        toast.success(nextValue ? "Tournament dipublikasikan" : "Tournament disembunyikan dari publik");
      }
    });
  };

  const publicTournaments = tournaments.filter((t) => t.show_on_schedule);
  const nearestPublic = [...publicTournaments].sort((a, b) => a.start_date.localeCompare(b.start_date))[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">
          Tournaments & Schedule
        </h1>
        <p className="mt-1 max-w-lg text-xs leading-relaxed text-[#6B6A68]">
          Tandai tournament sebagai <span className="font-semibold text-[#F5C400]/80">Publik</span> untuk
          menampilkannya di halaman <span className="text-white/50">/schedule</span> dan upcoming matches di homepage.
          Tournament publik yang paling dekat otomatis tampil sebagai countdown di hero section.
        </p>
        {publicTournaments.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[#F5C400]">
              {publicTournaments.length} publik
            </span>
            {nearestPublic && (
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Zap className="h-3 w-3 text-[#F5C400]" />
                Hero countdown: <span className="text-white/60">{nearestPublic.name}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {tournaments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded border border-[#2D2D2D] py-16 text-center">
          <CalendarRange className="mb-3 h-8 w-8 text-[#6B6A68]" />
          <p className="text-sm text-[#6B6A68]">Belum ada tournament yang dikonfirmasi pendaftarannya.</p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Centang &quot;is_registered&quot; di workspace tournament terlebih dahulu.
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {tournaments.map((t) => {
          const isNearest = nearestPublic?.id === t.id;
          return (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded border px-4 py-3 transition ${
                t.show_on_schedule
                  ? "border-[#F5C400]/30 bg-[#1a1800]"
                  : "border-[#2D2D2D] bg-[#1a1a1a]"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[#D4D4D4]">{t.name}</p>
                  {isNearest && (
                    <span className="flex shrink-0 items-center gap-1 rounded bg-[#F5C400]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F5C400]">
                      <Zap className="h-2.5 w-2.5" /> Hero
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[#6B6A68]">
                  {t.start_date}
                  {t.start_time ? ` · ${t.start_time.slice(0, 5)}` : ""} &nbsp;·&nbsp; {t.status}
                </p>
              </div>

              <button
                onClick={() => handleToggleSchedule(t.id, t.show_on_schedule)}
                disabled={pending}
                className={`ml-4 shrink-0 cursor-pointer px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${
                  t.show_on_schedule
                    ? "border border-[#F5C400] bg-[#F5C400] text-black"
                    : "border border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400]/50 hover:text-[#F5C400]"
                }`}
              >
                {t.show_on_schedule ? "Publik ✓" : "Publik"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export { TournamentsAdminClient };
