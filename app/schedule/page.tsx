import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange } from "lucide-react";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ScheduleCountdown } from "@/components/landing/ScheduleCountdown";
import { getScheduleTournaments } from "@/features/admin/queries";
import type { PublicTournament } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule — Hyperion Team",
  description: "Jadwal turnamen mendatang Hyperion Team.",
};

function groupByMonth(tournaments: PublicTournament[]): Map<string, PublicTournament[]> {
  const map = new Map<string, PublicTournament[]>();
  for (const t of tournaments) {
    const key = t.start_date.slice(0, 7);
    const group = map.get(key) ?? [];
    group.push(t);
    map.set(key, group);
  }
  return map;
}

function formatMonthHeader(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" }).toUpperCase();
}

function formatDate(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr + "T00:00:00");
  const d = date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  return timeStr ? `${d} · ${timeStr.slice(0, 5)}` : d;
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "UPCOMING",
  ongoing: "ONGOING",
  completed: "SELESAI",
};

const STATUS_COLOR: Record<string, string> = {
  upcoming: "text-[#F5C400] border-[#F5C400]/30 bg-[#F5C400]/10",
  ongoing: "text-green-400 border-green-400/30 bg-green-400/10",
  completed: "text-white/30 border-white/10 bg-white/5",
};

const SchedulePage = async () => {
  const tournaments = await getScheduleTournaments();
  const nearest = tournaments[0] ?? null;
  const grouped = groupByMonth(tournaments);

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                Hyperion Team
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Schedule
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/55">
              Jadwal turnamen mendatang Hyperion Team.
            </p>

            {nearest && (
              <div className="mt-10">
                <ScheduleCountdown tournament={nearest} />
              </div>
            )}
          </div>
        </section>

        {/* Tournament list */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {tournaments.length === 0 ? (
              <div className="border border-white/12 bg-[#071428] py-20 text-center">
                <CalendarRange className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/45">Belum ada jadwal turnamen yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {Array.from(grouped.entries()).map(([monthKey, items]) => (
                  <div key={monthKey}>
                    <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.4em] text-white/40">
                      {formatMonthHeader(monthKey)}
                    </h2>
                    <div className="divide-y divide-white/8 border border-white/12">
                      {items.map((t) => (
                        <div
                          key={t.id}
                          className="flex flex-col gap-3 bg-[#071428] px-5 py-5 sm:flex-row sm:items-center sm:gap-6"
                        >
                          {/* Date */}
                          <div className="w-full shrink-0 sm:w-52">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5C400]">
                              {formatDate(t.start_date, t.start_time)}
                            </p>
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="font-black uppercase tracking-tight text-white sm:text-lg">
                              {t.name}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                              {t.game && <span>{t.game}</span>}
                              {t.game && t.division_name && <span>·</span>}
                              {t.division_name && <span>{t.division_name}</span>}
                              {t.organizer && <><span>·</span><span>{t.organizer}</span></>}
                              {t.prize_pool && <><span>·</span><span className="text-[#F5C400]/70">{t.prize_pool}</span></>}
                            </div>
                          </div>

                          {/* Right: status + register */}
                          <div className="flex shrink-0 items-center gap-3">
                            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[t.status] ?? STATUS_COLOR.upcoming}`}>
                              {STATUS_LABEL[t.status] ?? t.status.toUpperCase()}
                            </span>
                            {t.registration_url && (
                              <Link
                                href={t.registration_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border border-[#F5C400] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
                              >
                                Daftar →
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};
export { SchedulePage as default };
