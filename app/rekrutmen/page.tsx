import Link from "next/link";
import Image from "next/image";
import {
  Gamepad2,
  Zap,
  Swords,
  Shield,
  Coins,
  Compass,
  Flame,
  Trophy,
  Target,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { InteractiveBackground } from "@/components/landing/InteractiveBackground";
import { getActivePublicTrials } from "@/features/trials/queries";
import { getSiteSettings } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.seo_rekrutmen_title || "Rekrutmen Terbuka — Hyperion Team",
    description:
      settings.seo_rekrutmen_description ||
      "Lihat posisi yang sedang dibuka dan daftar jadi bagian dari Hyperion Team.",
  };
}

const ROLE_ICONS: Record<string, LucideIcon> = {
  jungler: Zap,
  "mid lane": Flame,
  "midlane": Flame,
  roamer: Compass,
  "gold lane": Coins,
  goldlane: Coins,
  "exp lane": Shield,
  explane: Shield,
  captain: Swords,
  coach: Trophy,
  analyst: Trophy,
  member: Activity,
};

function getRoleIcon(pos: string): LucideIcon {
  const key = pos.toLowerCase();
  for (const [k, icon] of Object.entries(ROLE_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return Target;
}

async function RekrutmenPage() {
  const [trials, settings] = await Promise.all([
    getActivePublicTrials(),
    getSiteSettings(),
  ]);

  const eyebrow = settings.rekrutmen_eyebrow || "Open Recruitment";
  const title = settings.rekrutmen_title || "REKRUTMEN";
  const description =
    settings.rekrutmen_description ||
    "Posisi yang sedang dibuka oleh Hyperion Team. Daftar sekarang dan tunjukkan kemampuanmu.";

  return (
    <>
      <Header />
      <main className="relative flex-1 bg-[#040D1C] overflow-hidden">
        <InteractiveBackground />

        {/* Hero */}
        <section className="relative z-10 overflow-hidden border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.3em] bg-gradient-to-r from-[#FFF099] via-[#F5C400] to-[#C79600] bg-clip-text text-transparent"
              >
                {eyebrow}
              </span>
              <div className="h-px w-8 bg-[#F5C400]" />
            </div>
            <h1 className="font-bebas text-6xl sm:text-7xl lg:text-8xl font-black uppercase tracking-wide text-white leading-none">
              {title}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
              {description}
            </p>
          </div>
        </section>

        {/* Trial cards */}
        <section className="relative z-10 px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {trials.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {trials.map((trial) => (
                  <div
                    key={trial.id}
                    className="group flex flex-col gap-5 rounded-2xl bg-slate-900/60 p-6 shadow-xl shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:bg-slate-900/75 hover:backdrop-blur-2xl hover:shadow-2xl hover:shadow-black/60"
                    style={{ border: "none" }}
                  >
                    {/* Org header */}
                    <div className="flex items-center gap-3">
                      {trial.org_logo_url ? (
                        <Image
                          src={trial.org_logo_url}
                          alt={trial.org_name}
                          width={36}
                          height={36}
                          className="h-9 w-9 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-black text-white/50">
                          {trial.org_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate text-xs font-semibold uppercase tracking-wider text-white/55">
                        {trial.org_name}
                      </span>
                    </div>

                    {/* Trial info */}
                    <div className="flex-1">
                      <h2 className="text-base font-black uppercase tracking-tight text-white">
                        {trial.title}
                      </h2>

                      {/* Game */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <Gamepad2 className="h-3 w-3 text-white/45" />
                        <span className="text-[11px] text-white/55">
                          {trial.game}
                        </span>
                      </div>

                      {/* Positions */}
                      {trial.positions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {trial.positions.map((pos) => {
                            const Icon = getRoleIcon(pos);
                            return (
                              <span
                                key={pos}
                                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#F5C400] transition-all duration-200 group-hover:[text-shadow:0_0_8px_rgba(245,196,0,0.6)]"
                              >
                                <Icon className="h-3 w-3" />
                                {pos}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/trial/${trial.public_token}`}
                      className="flex items-center justify-center bg-[#F5C400] py-2.5 text-xs font-black uppercase tracking-widest text-black transition-all duration-200 hover:bg-white clip-cyber-btn"
                    >
                      Daftar Sekarang →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl py-20 text-center shadow-[0_0_30px_rgba(0,0,0,0.4)]"
                style={{
                  background:
                    "linear-gradient(135deg, #0d1b2e 0%, #1a2a40 60%, #0a1520 100%)",
                  border: "none",
                }}
              >
                <Gamepad2 className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm font-semibold text-white/50">
                  Tidak ada rekrutmen terbuka saat ini.
                </p>
                <p className="mt-2 text-xs text-white/38">
                  Pantau terus — posisi baru akan diumumkan di sini.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export { RekrutmenPage as default };
