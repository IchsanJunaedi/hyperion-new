import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getNewsPostBySlug, getSiteSettings } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getNewsPostBySlug(slug),
    getSiteSettings(),
  ]);
  if (!post) return { title: "Not Found" };
  const coverImage = post.cover_image_url || settings.default_news_image || "/brand/logo.jpg";
  return {
    title: `${post.title} — Hyperion Team`,
    description: post.excerpt ?? undefined,
    openGraph: coverImage ? { images: [coverImage] } : undefined,
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const NewsDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getNewsPostBySlug(slug),
    getSiteSettings(),
  ]);
  if (!post) notFound();

  const coverImage = post.cover_image_url || settings.default_news_image || "/brand/logo.jpg";

  return (
    <>
      <Header />
      <main className="min-h-screen flex-1 bg-[#040D1C] pt-20">
        {/* Cover image full-width */}
        {coverImage && (
          <div className="relative h-[40vh] min-h-[280px] w-full overflow-hidden sm:h-[50vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={post.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040D1C] via-transparent to-transparent" />
          </div>
        )}

        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          {/* Back */}
          <Link
            href="/news"
            className="mb-10 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/35 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Semua Berita
          </Link>

          {/* Category + date + read time */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {post.category && (
              <span className="rounded-md bg-[#F5C400] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#020202]">
                {post.category}
              </span>
            )}
            {post.published_at && (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/35">
                <Calendar className="h-3 w-3" />
                {formatDate(post.published_at)}
              </span>
            )}
            {post.read_time && (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/35">
                <Clock className="h-3 w-3" />
                {post.read_time} menit baca
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">
              {post.excerpt}
            </p>
          )}

          {/* Divider */}
          <div className="my-8 h-px w-full bg-white/[0.06]" />

          {/* Body */}
          {post.content && (
            <div className="whitespace-pre-wrap text-[15px] leading-[1.85] text-white/70">
              {post.content}
            </div>
          )}

          {/* Footer back */}
          <div className="mt-16 border-t border-white/[0.06] pt-8">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#F5C400] transition hover:opacity-70"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke semua berita
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};
export { NewsDetailPage as default };
