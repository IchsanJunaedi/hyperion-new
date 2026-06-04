import Link from "next/link";
import Image from "next/image";
import { Gamepad2 } from "lucide-react";
import type { Metadata } from "next";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getActivePublicTrials } from "@/features/trials/queries";
import { getSiteSettings } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.seo_rekrutmen_title || "Rekrutmen Terbuka — Hyperion Team",
    description: settings.seo_rekrutmen_description || "Lihat posisi yang sedang dibuka dan daftar jadi bagian dari Hyperion Team.",
  };
}

export default async function RekrutmenPage() {
  const [trials, settings] = await Promise.all([
    getActivePublicTrials(),
    getSiteSettings(),
  ]);

  const eyebrow = settings.rekrutmen_eyebrow || "Open Recruitment";
  const title = settings.rekrutmen_title || "REKRUTMEN";
  const description = settings.rekrutmen_description || "Posisi yang sedang dibuka oleh Hyperion Team. Daftar sekarang dan tunjukkan kemampuanmu.";

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                {eyebrow}
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
              {description}
            </p>
          </div>
        </section>

        {/* Trial cards */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {trials.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trials.map((trial) => (
                  <div
                    key={trial.id}
                    className="flex flex-col gap-5 border border-white/12 bg-[#071428] p-6"
                  >
                    {/* Org header */}
                    <div className="flex items-center gap-3">
                      {trial.org_logo_url ? (
                        <Image
                          src={trial.org_logo_url}
                          alt={trial.org_name}
                          width={36}
                          height={36}
                          className="h-9 w-9 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#0C1E3C] text-xs font-black text-white/50">
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
                        <span className="text-[11px] text-white/55">{trial.game}</span>
                      </div>

                      {/* Positions */}
                      {trial.positions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {trial.positions.map((pos) => (
                            <span
                              key={pos}
                              className="rounded border border-[#F5C400]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F5C400]"
                            >
                              {pos}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/trial/${trial.public_token}`}
                      className="flex items-center justify-center border border-[#F5C400] py-2.5 text-xs font-black uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
                    >
                      Daftar Sekarang
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-white/12 bg-[#071428] py-20 text-center">
                <Gamepad2 className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm font-semibold text-white/50">
                  Tidak ada rekrutmen terbuka saat ini.
                </p>
                <p className="mt-2 text-xs text-white/38">Pantau terus — posisi baru akan diumumkan di sini.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
