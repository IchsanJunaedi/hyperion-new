import type { Metadata } from "next";
import { Handshake } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getPublicSponsors } from "@/features/admin/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sponsors — Hyperion Team",
  description: "Brand dan sponsor yang mendukung Hyperion Team.",
};

const SponsorsPage = async () => {
  const sponsors = await getPublicSponsors();
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        <section className="border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">Hyperion Team</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">Sponsors</h1>
            <p className="mt-3 text-sm text-white/55">Brand dan mitra yang mendukung perjalanan Hyperion Team.</p>
          </div>
        </section>
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {sponsors.length === 0 ? (
              <div className="border border-white/12 bg-[#071428] py-20 text-center">
                <Handshake className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/45">Belum ada sponsor yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {sponsors.map((s) => (
                  <div key={s.id} className="flex items-center justify-center border border-white/10 bg-[#071428] p-6 transition hover:border-[#F5C400]/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logo_url} alt={s.name} className="max-h-16 w-full object-contain" />
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
export { SponsorsPage as default };
