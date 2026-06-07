"use client";

import Link from "next/link";
import { useRef } from "react";
import { Newspaper } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { NewsPost } from "@/features/admin/queries";
import { GridTexture, PlusTexture } from "@/components/landing/LandingTextures";

interface Props {
  posts: NewsPost[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const LatestNewsSection = ({ posts }: Props) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".news-header", {
      y: 16, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
    gsap.from(".news-card", {
      y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out",
      scrollTrigger: { trigger: ".news-card", start: "top 88%", once: true },
    });
  }, { scope: sectionRef });

  if (posts.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
      <GridTexture opacity={0.03} />
      <PlusTexture opacity={0.018} />
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="news-header mb-8 flex flex-wrap items-end justify-between gap-4 pb-8">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="h-4 w-0.5 bg-[#F5C400]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                News &amp; Updates
              </p>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Latest News
            </h2>
          </div>
          <Link
            href="/news"
            className="text-[11px] font-bold uppercase tracking-widest text-[#F5C400]/60 transition hover:text-[#F5C400]"
          >
            Lihat semua →
          </Link>
        </div>

        {/* Cards — image-bg overlay (gamingonavax style) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div key={post.id} className="news-card">
              <Link
                href={`/news/${post.slug}`}
                className="group relative flex h-64 overflow-hidden border border-white/[0.08] transition-all duration-300 hover:border-[#F5C400]/30"
              >
                {post.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.cover_image_url}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: "brightness(0.55) saturate(0.7)" }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/[0.03]">
                    <Newspaper className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(245,196,0,0.06) 0%, transparent 70%)" }}
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
                  <span className="w-fit border border-[#F5C400]/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F5C400]/80">
                    {formatDate(post.published_at)}
                  </span>
                  <p className="font-black uppercase leading-tight tracking-tight text-white transition-colors duration-200 group-hover:text-[#F5C400]">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/50">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { LatestNewsSection };
