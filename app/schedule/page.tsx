import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange } from "lucide-react";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ScheduleCountdown } from "@/components/landing/ScheduleCountdown";
import { InteractiveBackground } from "@/components/landing/InteractiveBackground";
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

function formatLeftDate(dateStr: string): { day: string; month: string } {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.toLocaleDateString("id-ID", { day: "2-digit" });
  const month = date.toLocaleDateString("id-ID", { month: "short" }).toUpperCase();
  return { day, month };
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "UPCOMING",
  ongoing: "ONGOING",
  completed: "SELESAI",
};

const STATUS_COLOR: Record<string, string> = {
  upcoming: "text-[#F5C400] border-[#F5C400]/30 bg-[#F5C400]/10",
  ongoing: "text-[#F5C400] border-[#F5C400]/30 bg-[#F5C400]/10",
  completed: "text-white/30 border-white/10 bg-white/5",
};

const SchedulePage = async () => {
  const tournaments = await getScheduleTournaments();
  const nearest = tournaments[0] ?? null;
  const grouped = groupByMonth(tournaments);

  return (
    <>
      <Header />
      <main className="relative flex-1 bg-[#040D1C] overflow-hidden">
        <InteractiveBackground />
        
        {/* Hero */}
        <section className="relative z-10 overflow-hidden border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] bg-gradient-to-r from-[#FFF099] via-[#F5C400] to-[#C79600] bg-clip-text text-transparent">
                Hyperion Team
              </span>
            </div>
            <h1 className="font-bebas text-6xl sm:text-7xl lg:text-8xl font-black uppercase tracking-wide text-white leading-none">
              Tournament Schedule
            </h1>
            <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-white/55">
              Jadwal turnamen mendatang dan riwayat pertandingan Hyperion Team di kancah esports profesional.
            </p>

            {nearest && (
              <div className="mt-12 w-full flex justify-center">
                <ScheduleCountdown tournament={nearest} />
              </div>
            )}
          </div>
        </section>

        {/* Tournament list */}
        <section className="relative z-10 px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-4xl">
            {tournaments.length === 0 ? (
              <div
                className="rounded-2xl py-20 text-center shadow-[0_0_30px_rgba(0,0,0,0.4)]"
                style={{
                  background: 'linear-gradient(135deg, #0d1b2e 0%, #1a2a40 60%, #0a1520 100%)',
                  border: 'none',
                }}
              >
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
                    <div className="flex flex-col gap-4">
                      {items.map((t) => (
                        <div
                          key={t.id}
                          className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 bg-slate-800/40 backdrop-blur-md rounded-2xl border p-6 transition-all duration-300 ${
                            t.status === "ongoing"
                              ? "border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)] animate-pulse"
                              : "border-white/5 hover:border-white/10"
                          } hover:bg-slate-800/60 hover:scale-[1.01]`}
                        >
                          {/* Sisi Kiri: Tanggal & Jam */}
                          <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center border-b sm:border-b-0 sm:border-r border-white/10 pb-3 sm:pb-0 pr-0 sm:pr-6 shrink-0 sm:w-28 gap-2">
                            <span className="font-bebas text-3xl font-black tracking-wide text-white leading-none">
                              {formatLeftDate(t.start_date).day} {formatLeftDate(t.start_date).month}
                            </span>
                            <span className="text-xs text-[#9B9A97] font-medium">
                              {t.start_time ? `${t.start_time.slice(0, 5)} WIB` : "TBA"}
                            </span>
                          </div>

                          {/* Bagian Tengah: Detail Turnamen */}
                          <div className="min-w-0 flex-1 py-1 sm:px-2">
                            <h3 className="font-black uppercase tracking-tight text-white text-lg sm:text-xl leading-tight">
                              {t.name}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#9B9A97] font-normal">
                              {t.game && <span>{t.game}</span>}
                              {t.game && t.division_name && <span>·</span>}
                              {t.division_name && <span>{t.division_name}</span>}
                              {t.organizer && <><span>·</span><span>{t.organizer}</span></>}
                              {t.prize_pool && <><span>·</span><span className="text-[#F5C400] font-medium">{t.prize_pool}</span></>}
                            </div>
                          </div>

                          {/* Sisi Kanan: Status Badge & Registrasi */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                            <span className={`rounded-full border px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[t.status] ?? STATUS_COLOR.upcoming}`}>
                              {STATUS_LABEL[t.status] ?? t.status.toUpperCase()}
                            </span>
                            {t.registration_url && (
                              <Link
                                href={t.registration_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 items-center justify-center bg-[#F5C400] hover:bg-white text-black font-bebas text-xs font-bold uppercase tracking-[0.1em] px-4 transition-colors duration-200 clip-cyber-btn"
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
