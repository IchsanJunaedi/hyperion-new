import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getPublishedNewsPosts } from "@/features/admin/queries";
import { NewsListClient } from "./_components/NewsListClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "News — Hyperion Team",
  description: "Berita dan update terbaru dari Hyperion Team.",
};

const NewsPage = async () => {
  const posts = await getPublishedNewsPosts();

  return (
    <>
      <Header />
      <main className="min-h-screen flex-1 bg-[#020202]">
        {/* Hero header */}
        <section className="px-6 pb-6 pt-28 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                Hyperion Team
              </span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tight text-white sm:text-6xl lg:text-7xl">
              News
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/45">
              Berita, update, dan pengumuman terbaru dari Hyperion Team.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-6 border-t border-white/[0.06] sm:mx-10 lg:mx-16" />

        <NewsListClient posts={posts} />
      </main>
      <Footer />
    </>
  );
};
export { NewsPage as default };
