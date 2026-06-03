import Link from "next/link";

import { AchievementsSection } from "@/components/landing/AchievementsSection";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { getGalleryEntries, getPublicAchievements, getSiteSettings } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const [galleries, achievements, settings] = await Promise.all([
    getGalleryEntries(),
    getPublicAchievements(),
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
      <main className="flex-1 bg-[#070707]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                Trophy Room
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              ACHIEVEMENT
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/40">
              Prestasi dan pencapaian Hyperion Team di berbagai turnamen nasional dan regional.
            </p>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {galleries.map((gallery) => (
                <div
                  key={gallery.slug}
                  className="relative flex flex-col border border-white/5 bg-[#0D0D0D] p-5"
                >
                  {/* Title + logo */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="flex-1 text-sm font-bold leading-snug text-white">
                      {gallery.title}
                    </h3>
                    {gallery.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={gallery.logo_url}
                        alt="Logo"
                        className="h-12 w-12 shrink-0 object-contain"
                      />
                    )}
                  </div>

                  {/* Meta */}
                  <ul className="mb-4 space-y-1 text-xs text-white/40">
                    <li>Divisi Hyperion: {gallery.division}</li>
                    <li>Tanggal Tournament: {gallery.tournament_date}</li>
                    <li>Juara: {gallery.position}</li>
                    <li>Online/Offline: {gallery.status}</li>
                  </ul>

                  {/* Preview images */}
                  <div className="mb-16 grid grid-cols-2 gap-2">
                    {gallery.preview_images.map((src, i) => (
                      <div key={i} className="aspect-video overflow-hidden bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`${gallery.title} ${i + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    {gallery.preview_images.length === 1 && (
                      <div className="aspect-video bg-white/[0.03]" />
                    )}
                  </div>

                  {/* View More */}
                  <div className="absolute bottom-5 right-5">
                    <Link
                      href={`/gallery/${gallery.slug}`}
                      className="inline-flex items-center border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/50 transition hover:border-[#F5C400]/40 hover:text-[#F5C400]"
                    >
                      View More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <AchievementsSection entries={achievements} />
      </main>
      <Footer settings={footerSettings} />
    </>
  );
}
