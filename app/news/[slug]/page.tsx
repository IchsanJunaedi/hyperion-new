import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getNewsPostBySlug } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} — Hyperion Team`,
    description: post.excerpt ?? undefined,
    openGraph: post.cover_image_url ? { images: [post.cover_image_url] } : undefined,
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
  const post = await getNewsPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C] pt-14">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">

          {/* Back link */}
          <Link
            href="/news"
            className="mb-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/35 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Semua Berita
          </Link>

          {/* Meta */}
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
            {formatDate(post.published_at)}
          </p>

          {/* Title */}
          <h1 className="mb-6 text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {/* Excerpt as lead paragraph */}
          {post.excerpt && (
            <p className="mb-8 text-base leading-relaxed text-white/60 sm:text-lg">
              {post.excerpt}
            </p>
          )}

          {/* Cover image — constrained to article width, 16:9 */}
          {post.cover_image_url && (
            <div className="mb-10 aspect-video w-full overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Divider */}
          <div className="mb-8 h-px w-12 bg-[#F5C400]" />

          {/* Body */}
          {post.content && (
            <div className="whitespace-pre-wrap text-[15px] leading-[1.8] text-white/70">
              {post.content}
            </div>
          )}

          {/* Footer back link */}
          <div className="mt-16 border-t border-white/10 pt-8">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#F5C400] transition hover:text-[#F5C400]/70"
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
