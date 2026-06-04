"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarRange } from "lucide-react";
import { toggleHeroTournamentAction, toggleTournamentScheduleAction } from "@/features/admin/actions";
import type { AdminTournament } from "@/features/admin/queries";

interface Props {
  tournaments: AdminTournament[];
}

const TournamentsAdminClient = ({ tournaments: initial }: Props) => {
  const [tournaments, setTournaments] = useState(initial);
  const [pending, startTransition] = useTransition();

  const handleToggleHero = (id: string, currentlyActive: boolean) => {
    const nextValue = !currentlyActive;
    setTournaments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, show_in_hero: nextValue } : t))
    );
    startTransition(async () => {
      const result = await toggleHeroTournamentAction(id, nextValue);
      if (!result.ok) {
        toast.error(result.message);
        setTournaments((prev) =>
          prev.map((t) => (t.id === id ? { ...t, show_in_hero: currentlyActive } : t))
        );
      } else {
        toast.success(nextValue ? "Ditampilkan di hero" : "Disembunyikan dari hero");
      }
    });
  };

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
        toast.success(nextValue ? "Tournament dipublikasikan ke schedule" : "Tournament disembunyikan dari schedule");
      }
    });
  };

  const heroCount = tournaments.filter((t) => t.show_in_hero).length;
  const scheduleCount = tournaments.filter((t) => t.show_on_schedule).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">
            Tournaments & Schedule
          </h1>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Toggle <span className="text-white/60">Hero</span> untuk countdown di landing page.{" "}
            Toggle <span className="text-[#F5C400]/80">Publik</span> untuk tampil di halaman{" "}
            <span className="text-white/50">/schedule</span> dan upcoming matches di homepage.
          </p>
          <div className="mt-1.5 flex items-center gap-4">
            {heroCount > 0 && (
              <p className="text-xs font-semibold text-white/50">{heroCount} di hero</p>
            )}
            {scheduleCount > 0 && (
              <p className="text-xs font-semibold text-[#F5C400]">{scheduleCount} publik</p>
            )}
          </div>
        </div>
      </div>

      {tournaments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded border border-[#2D2D2D] py-16 text-center">
          <CalendarRange className="mb-3 h-8 w-8 text-[#6B6A68]" />
          <p className="text-sm text-[#6B6A68]">
            Belum ada tournament yang dikonfirmasi pendaftarannya.
          </p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Centang &quot;is_registered&quot; di workspace tournament terlebih dahulu.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className={`flex items-center justify-between rounded border px-4 py-3 transition ${
              t.show_on_schedule
                ? "border-[#F5C400]/30 bg-[#1a1800]"
                : "border-[#2D2D2D] bg-[#1a1a1a]"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#D4D4D4]">{t.name}</p>
              <p className="mt-0.5 text-xs text-[#6B6A68]">
                Mulai: {t.start_date}
                {t.start_time ? ` ${t.start_time.slice(0, 5)}` : ""} &nbsp;·&nbsp;
                Status: {t.status}
              </p>
            </div>

            <div className="ml-4 flex shrink-0 items-center gap-2">
              {/* Hero toggle */}
              <button
                onClick={() => handleToggleHero(t.id, t.show_in_hero)}
                disabled={pending}
                className={`cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${
                  t.show_in_hero
                    ? "border border-white/40 bg-white/10 text-white"
                    : "border border-[#2D2D2D] text-[#6B6A68] hover:border-white/30 hover:text-white/60"
                }`}
              >
                {t.show_in_hero ? "Hero ✓" : "Hero"}
              </button>

              {/* Schedule / Publik toggle */}
              <button
                onClick={() => handleToggleSchedule(t.id, t.show_on_schedule)}
                disabled={pending}
                className={`cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${
                  t.show_on_schedule
                    ? "border border-[#F5C400] bg-[#F5C400] text-black"
                    : "border border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400]/50 hover:text-[#F5C400]"
                }`}
              >
                {t.show_on_schedule ? "Publik ✓" : "Publik"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export { TournamentsAdminClient };
