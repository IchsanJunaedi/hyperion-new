import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getPublicResults } from "@/features/admin/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Results — Hyperion Team",
  description: "Hasil turnamen Hyperion Team.",
};

const PLACEMENT_LABEL: Record<number, string> = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };
const PLACEMENT_COLOR: Record<number, string> = {
  1: "text-[#F5C400] border-[#F5C400]/30 bg-[#F5C400]/10",
  2: "text-[#9B9A97] border-[#9B9A97]/30 bg-white/5",
  3: "text-[#CD7F32] border-[#CD7F32]/30 bg-[#CD7F32]/10",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const ResultsPage = async () => {
  const results = await getPublicResults();
  return (
    <>
      <Header />
      <main className="relative flex-1 bg-[#040D1C] overflow-hidden">
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
              <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] bg-gradient-to-r from-[#FFF099] via-[#F5C400] to-[#C79600] bg-clip-text text-transparent">Hyperion Team</span>
            </div>
            <h1 className="font-bebas text-6xl sm:text-7xl lg:text-8xl font-black uppercase tracking-wide text-white leading-none">Results</h1>
            <p className="mt-4 text-sm sm:text-base text-white/55">Rekam jejak hasil turnamen Hyperion Team.</p>
          </div>
        </section>
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {results.length === 0 ? (
              <div
                className="rounded-2xl py-20 text-center shadow-[0_0_30px_rgba(0,0,0,0.4)]"
                style={{ background: "linear-gradient(135deg, #0d1b2e 0%, #1a2a40 60%, #0a1520 100%)", border: "none" }}
              >
                <Trophy className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/45">Belum ada hasil turnamen yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r) => (
                  <div key={r.id} className="flex flex-col border border-white/10 bg-[#071428]">
                    {r.result_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.result_image_url} alt={r.tournament_name} className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-[#0C1E3C]">
                        <Trophy className="h-10 w-10 text-white/10" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{formatDate(r.recorded_at)}</p>
                      <p className="font-black uppercase leading-tight tracking-tight text-white">{r.tournament_name}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {r.placement && r.placement <= 3 ? (
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PLACEMENT_COLOR[r.placement]}`}>
                            {PLACEMENT_LABEL[r.placement]}
                          </span>
                        ) : (
                          <span className="text-xs text-white/30">Gugur</span>
                        )}
                        {r.prize_earned && (
                          <span className="text-xs text-[#F5C400]/70">Rp {Number(r.prize_earned).toLocaleString("id-ID")}</span>
                        )}
                      </div>
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
export { ResultsPage as default };
