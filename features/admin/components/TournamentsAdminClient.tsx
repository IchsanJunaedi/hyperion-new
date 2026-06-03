"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarRange } from "lucide-react";
import { toggleHeroTournamentAction } from "@/features/admin/actions";
import type { AdminTournament } from "@/features/admin/queries";

interface Props {
  tournaments: AdminTournament[];
}

const TournamentsAdminClient = ({ tournaments: initial }: Props) => {
  const [tournaments, setTournaments] = useState(initial);
  const [pending, startTransition] = useTransition();

  const handleToggle = (id: string, currentlyActive: boolean) => {
    const nextId = currentlyActive ? null : id;

    // Optimistic update
    setTournaments((prev) =>
      prev.map((t) => ({ ...t, show_in_hero: t.id === id ? !currentlyActive : false }))
    );

    startTransition(async () => {
      const result = await toggleHeroTournamentAction(nextId);
      if (!result.ok) {
        toast.error(result.message);
        // Revert on error
        setTournaments(initial);
      } else {
        toast.success(
          nextId ? "Tournament ditampilkan di hero" : "Tournament disembunyikan dari hero"
        );
      }
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">
            Tournaments
          </h1>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Pilih satu tournament untuk ditampilkan sebagai countdown di hero section.
            Hanya tournament yang sudah dikonfirmasi pendaftarannya (is_registered) yang muncul di sini.
          </p>
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
            className="flex items-center justify-between rounded border border-[#2D2D2D] bg-[#1a1a1a] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#D4D4D4]">{t.name}</p>
              <p className="mt-0.5 text-xs text-[#6B6A68]">
                Mulai: {t.start_date}
                {t.start_time ? ` ${t.start_time.slice(0, 5)}` : ""} &nbsp;·&nbsp;
                Status: {t.status}
              </p>
            </div>

            <button
              onClick={() => handleToggle(t.id, t.show_in_hero)}
              disabled={pending}
              className={`ml-4 shrink-0 cursor-pointer px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                t.show_in_hero
                  ? "border border-[#F5C400] bg-[#F5C400] text-black hover:bg-transparent hover:text-[#F5C400]"
                  : "border border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400] hover:text-[#F5C400]"
              } disabled:opacity-50`}
            >
              {t.show_in_hero ? "Aktif di Hero" : "Tampilkan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export { TournamentsAdminClient };
