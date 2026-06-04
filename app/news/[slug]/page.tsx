import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const NewsDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const post = await getNewsPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt={post.title} className="h-64 w-full object-cover sm:h-80 lg:h-96" />
        )}
        <article className="mx-auto max-w-3xl px-6 py-16 sm:px-10">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
            {formatDate(post.published_at)}
          </p>
          <h1 className="mb-6 text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mb-8 border-l-2 border-[#F5C400]/40 pl-4 text-base leading-relaxed text-white/60">
              {post.excerpt}
            </p>
          )}
          {post.content && (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
              {post.content}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
};
export { NewsDetailPage as default };
