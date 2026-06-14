import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { GalleryCard } from "@/components/landing/GalleryCard";
import { getGalleryEntries, getSiteSettings, getPublicAchievements } from "@/features/admin/queries";
import { slugify } from "@/lib/utils/slugify";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function GalleryPage() {
  const [galleryEntries, manualAchievements, settings] = await Promise.all([
    getGalleryEntries(),
    getPublicAchievements(),
    getSiteSettings(),
  ]);

  const admin = createAdminClient();
  const { data: divisionsData } = await admin
    .from("divisions")
    .select("id, name")
    .limit(100);
  const divMap = new Map((divisionsData ?? []).map((d) => [d.id, d.name]));

  // Map achievements to GalleryEntry shape
  const manualAsGallery = manualAchievements.map((a) => ({
    id: a.id,
    slug: slugify(a.title),
    title: a.title,
    division: divMap.get(a.division_id ?? "") ?? "Esports",
    tournament_date: a.achieved_at,
    position: a.placement
      ? (a.placement === 1
          ? "Champion"
          : a.placement === 2
          ? "Runner Up"
          : "3rd Place")
      : "Winner",
    status: "Completed",
    logo_url: a.image_url || "/brand/logo.jpg",
    preview_images: [a.image_url || "/brand/logo.jpg"],
    description: a.description ?? "",
    sort_order: 0,
    metric_value: null,
    metric_label: null,
    created_at: a.created_at,
    updated_at: a.created_at,
  }));

  // Merge: manual achievements take priority by title
  const manualTitles = new Set(manualAsGallery.map((m) => m.title));
  const merged = [
    ...manualAsGallery,
    ...galleryEntries.filter((g) => !manualTitles.has(g.title)),
  ];

  // Sort by date (newest first)
  function getTime(dateStr: string): number {
    if (!dateStr) return 0;
    const clean = /^\d{4}$/.test(dateStr) ? `${dateStr}-01-01` : dateStr;
    const t = new Date(clean).getTime();
    return isNaN(t) ? 0 : t;
  }
  merged.sort((x, y) => getTime(y.tournament_date) - getTime(x.tournament_date));

  const galleries = merged;

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
