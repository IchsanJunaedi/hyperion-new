import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { InteractiveBackground } from "@/components/landing/InteractiveBackground";
import { getPublishedNewsPosts, getSiteSettings } from "@/features/admin/queries";
import { NewsListClient } from "./_components/NewsListClient";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.seo_news_title || "News — Hyperion Team",
    description: settings.seo_news_description || "Berita dan update terbaru dari Hyperion Team.",
  };
}

const NewsPage = async () => {
  const [posts, settings] = await Promise.all([
    getPublishedNewsPosts(),
    getSiteSettings(),
  ]);
  const defaultImage = settings.default_news_image || "/brand/logo.jpg";

  return (
    <>
      <Header />
      <main className="relative min-h-screen flex-1 bg-[#040D1C] overflow-hidden">
        <InteractiveBackground />
        {/* Hero header */}
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
              News
            </h1>
            <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-white/55">
              Berita, update, dan pengumuman terbaru dari Hyperion Team.
            </p>
          </div>
        </section>

        <NewsListClient posts={posts} defaultImage={defaultImage} />
      </main>
      <Footer />
    </>
  );
};
export { NewsPage as default };
