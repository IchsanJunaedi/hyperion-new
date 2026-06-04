import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getPublishedNewsPosts } from "@/features/admin/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "News — Hyperion Team",
  description: "Berita dan update terbaru dari Hyperion Team.",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const NewsPage = async () => {
  const posts = await getPublishedNewsPosts();
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
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">News</h1>
            <p className="mt-3 text-sm text-white/55">Berita dan update terbaru dari Hyperion Team.</p>
          </div>
        </section>

        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {posts.length === 0 ? (
              <div className="border border-white/12 bg-[#071428] py-20 text-center">
                <Newspaper className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/45">Belum ada artikel yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Link key={post.id} href={`/news/${post.slug}`}
                    className="group flex flex-col border border-white/10 bg-[#071428] transition hover:border-[#F5C400]/40">
                    {post.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.cover_image_url} alt={post.title} className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center bg-[#0C1E3C]">
                        <Newspaper className="h-10 w-10 text-white/10" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#F5C400]/70">
                        {formatDate(post.published_at)}
                      </p>
                      <p className="font-black uppercase leading-tight tracking-tight text-white transition group-hover:text-[#F5C400]">
                        {post.title}
                      </p>
                      {post.excerpt && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-white/45">{post.excerpt}</p>
                      )}
                    </div>
                  </Link>
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
export { NewsPage as default };
