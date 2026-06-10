import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { GalleryCard } from "@/components/landing/GalleryCard";
import { getGalleryEntries, getSiteSettings } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

async function GalleryPage() {
  const [galleries, settings] = await Promise.all([
    getGalleryEntries(),
    getSiteSettings(),
  ]);

  const footerSettings = {
    footer_tagline:
      settings.footer_tagline ??
      "Empowering Young Talents to Rise and Rule. Est. 2020 — Palembang, Indonesia.",
    footer_instagram_handle: settings.footer_instagram_handle ?? "@hyperionteam.id",
    footer_instagram_url:
      settings.footer_instagram_url ?? "https://www.instagram.com/hyperionteam.id/",
    footer_hashtag: settings.footer_hashtag ?? "#HypeWin",
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/8 px-6 pt-32 pb-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px]"
            style={{
              background:
                "radial-gradient(circle at 80% 50%, rgba(245,196,0,0.05) 0%, transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] bg-gradient-to-r from-[#FFF099] via-[#F5C400] to-[#C79600] bg-clip-text text-transparent">
                Hyperion Team
              </span>
            </div>
            <h1 className="font-bebas text-6xl sm:text-7xl lg:text-8xl font-black uppercase tracking-wide text-white leading-none">
              Achievement
            </h1>
            <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-white/55">
              Prestasi dan pencapaian Hyperion Team di berbagai turnamen nasional dan regional.
            </p>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-[1440px]">
            {galleries.length === 0 ? (
              <p className="text-sm text-white/30">Belum ada data achievement.</p>
            ) : (
              <div className="flex flex-col gap-16 md:gap-20">
                {galleries.map((gallery, i) => (
                  <GalleryCard
                    key={gallery.slug}
                    index={i}
                    slug={gallery.slug}
                    title={gallery.title}
                    division={gallery.division}
                    tournamentDate={gallery.tournament_date}
                    position={gallery.position}
                    logoUrl={gallery.logo_url}
                    previewImages={gallery.preview_images ?? []}
                    total={galleries.length}
                    metricValue={gallery.metric_value}
                    metricLabel={gallery.metric_label}
                    description={gallery.description}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer settings={footerSettings} />
    </>
  );
}

export { GalleryPage as default };
