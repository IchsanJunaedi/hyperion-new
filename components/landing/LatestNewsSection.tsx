"use client";

import Link from "next/link";
import { useRef } from "react";
import { Newspaper } from "lucide-react";
import { motion, useInView } from "motion/react";
import type { NewsPost } from "@/features/admin/queries";

interface Props {
  posts: NewsPost[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const LatestNewsSection = ({ posts }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  if (posts.length === 0) return null;

  return (
    <section className="bg-[#040D1C] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/12 pb-8"
        >
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
              News & Updates
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Latest News
            </h2>
          </div>
          <Link
            href="/news"
            className="text-[11px] font-bold uppercase tracking-widest text-[#F5C400] transition hover:text-[#F5C400]/70"
          >
            Lihat semua berita →
          </Link>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
            >
              <Link
                href={`/news/${post.slug}`}
                className="group flex h-full flex-col border border-white/10 bg-[#071428] transition-all duration-200 hover:border-[#F5C400]/40 hover:bg-[#0C1E3C]"
              >
                {post.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-[#0A1628]">
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
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/45">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { LatestNewsSection };
