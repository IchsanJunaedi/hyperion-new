import type { Metadata } from "next";
import { Handshake } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { InteractiveBackground } from "@/components/landing/InteractiveBackground";
import { getPublicSponsors, getSiteSettings } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.seo_sponsors_title || "Sponsors — Hyperion Team",
    description: settings.seo_sponsors_description || "Brand dan sponsor yang mendukung Hyperion Team.",
  };
}

const SponsorsPage = async () => {
  const sponsors = await getPublicSponsors();

  // Split sponsors into two rows: top and bottom
  const row1 = sponsors.slice(0, Math.ceil(sponsors.length / 2));
  const row2 = sponsors.slice(Math.ceil(sponsors.length / 2));

  // Helper to repeat items to ensure the marquee container fills the width and loops seamlessly
  const duplicateList = (list: typeof sponsors, targetSize = 8) => {
    if (list.length === 0) return [];
    let doubled = [...list];
    while (doubled.length < targetSize) {
      doubled = [...doubled, ...list];
    }
    // Duplicate the final array once more for the seamless translation loop
    return [...doubled, ...doubled];
  };

  const row1Items = duplicateList(row1);
  const row2Items = duplicateList(row2);

  return (
    <>
      <Header />
      <main className="relative flex-1 bg-[#040D1C] overflow-hidden">
        <InteractiveBackground />
        
        {/* Inject marquee keyframe styling */}
        <style>{`
          @keyframes scroll-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll-right {
            display: flex;
            width: max-content;
            animation: scroll-right 30s linear infinite;
          }
          .animate-scroll-left {
            display: flex;
            width: max-content;
            animation: scroll-left 30s linear infinite;
          }
        `}</style>

        {/* Hero header */}
        <section className="relative z-10 border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] bg-gradient-to-r from-[#FFF099] via-[#F5C400] to-[#C79600] bg-clip-text text-transparent">Hyperion Team</span>
            </div>
            <h1 className="font-bebas text-6xl sm:text-7xl font-black uppercase tracking-wide text-white leading-none">Sponsors</h1>
            <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-white/55">Brand dan mitra yang mendukung perjalanan Hyperion Team.</p>
          </div>
        </section>

        {/* Sponsors list marquee container */}
        <section className="relative z-10 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-5xl relative">
            {sponsors.length === 0 ? (
              <div
                className="rounded-2xl py-20 text-center shadow-[0_0_30px_rgba(0,0,0,0.4)]"
                style={{
                  background: 'linear-gradient(135deg, #0d1b2e 0%, #1a2a40 60%, #0a1520 100%)',
                  border: 'none',
                }}
              >
                <Handshake className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/45">Belum ada sponsor yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="relative space-y-6 overflow-hidden py-4">
                {/* Left & Right fading shadows */}
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#040D1C] to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#040D1C] to-transparent z-10 pointer-events-none" />

                {/* Row 1: Moving Right */}
                <div className="overflow-hidden w-full flex">
                  <div className="animate-scroll-right flex items-center gap-6">
                    {row1Items.map((s, idx) => (
                      <div
                        key={`${s.id}-r1-${idx}`}
                        className="flex h-24 w-48 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-slate-800/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-white/10 hover:bg-slate-800/60"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.logo_url || ""}
                          alt={s.name}
                          className="max-h-12 w-full object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 2: Moving Left */}
                <div className="overflow-hidden w-full flex">
                  <div className="animate-scroll-left flex items-center gap-6">
                    {row2Items.map((s, idx) => (
                      <div
                        key={`${s.id}-r2-${idx}`}
                        className="flex h-24 w-48 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-slate-800/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-white/10 hover:bg-slate-800/60"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.logo_url || ""}
                          alt={s.name}
                          className="max-h-12 w-full object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
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
