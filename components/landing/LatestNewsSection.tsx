"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { NewsPost } from "@/features/admin/queries";

interface Props {
  posts: NewsPost[];
}

// ── Fallback dummy data ───────────────────────────────────────────────────────
const DUMMY_POSTS: NewsPost[] = [
  {
    id: "d1", slug: "hyperion-juara-mpl-s14",
    title: "Hyperion Raih Juara 1 MPL Indonesia Season 14",
    excerpt: "Tim Mobile Legends Hyperion berhasil mengalahkan EVOS Legends di grand final dengan skor 3-1 dan membawa pulang trofi bergengsi.",
    content: null, status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    published_at: "2026-05-15T10:00:00Z", updated_at: "2026-05-15T10:00:00Z", created_at: "2026-05-15T10:00:00Z",
    category: "unggulan", read_time: 4,
  },
  {
    id: "d2", slug: "rekrutmen-ff-pubgm",
    title: "Rekrutmen Terbuka: Divisi Free Fire & PUBG Mobile",
    excerpt: "Hyperion membuka pendaftaran untuk pemain berbakat di divisi Free Fire dan PUBG Mobile. Daftar sebelum 30 Juni 2026.",
    content: null, status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop",
    published_at: "2026-05-20T08:00:00Z", updated_at: "2026-05-20T08:00:00Z", created_at: "2026-05-20T08:00:00Z",
    category: "update_tim", read_time: 3,
  },
  {
    id: "d3", slug: "bootcamp-turnamen-nasional-2026",
    title: "Bootcamp Intensif Persiapan Turnamen Nasional 2026",
    excerpt: "Seluruh roster menjalani bootcamp 2 minggu di Bandung dalam rangka persiapan menghadapi turnamen nasional bulan Juli.",
    content: null, status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=800&auto=format&fit=crop",
    published_at: "2026-05-25T09:00:00Z", updated_at: "2026-05-25T09:00:00Z", created_at: "2026-05-25T09:00:00Z",
    category: "turnamen", read_time: 5,
  },
  {
    id: "d4", slug: "coach-baru-hyperion",
    title: "Coach Baru Bergabung: Strategi Baru untuk Musim Berikutnya",
    excerpt: "Hyperion memperkenalkan head coach baru dari tim profesional Korea Selatan.",
    content: null, status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop",
    published_at: "2026-06-01T07:00:00Z", updated_at: "2026-06-01T07:00:00Z", created_at: "2026-06-01T07:00:00Z",
    category: "update_tim", read_time: 2,
  },
  {
    id: "d5", slug: "kemitraan-brand-gaming",
    title: "Kemitraan Strategis dengan Brand Gaming Lokal",
    excerpt: "Hyperion menandatangani kontrak sponsorship dengan dua brand gaming lokal terkemuka.",
    content: null, status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=800&auto=format&fit=crop",
    published_at: "2026-06-03T11:00:00Z", updated_at: "2026-06-03T11:00:00Z", created_at: "2026-06-03T11:00:00Z",
    category: "unggulan", read_time: 3,
  },
  {
    id: "d6", slug: "turnamen-internal-divisi",
    title: "Turnamen Internal Antar Divisi: Siapa yang Terkuat?",
    excerpt: "Lima divisi Hyperion bertarung dalam turnamen internal bulanan.",
    content: null, status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?q=80&w=800&auto=format&fit=crop",
    published_at: "2026-06-05T14:00:00Z", updated_at: "2026-06-05T14:00:00Z", created_at: "2026-06-05T14:00:00Z",
    category: "turnamen", read_time: 6,
  },
  {
    id: "d7", slug: "highlight-vod-draft-juni",
    title: "Highlight VOD: Analisis Draft Pick Terbaik Bulan Ini",
    excerpt: "Tim coaching merilis analisis mendalam tentang draft pick paling efektif bulan Juni.",
    content: null, status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?q=80&w=800&auto=format&fit=crop",
    published_at: "2026-06-07T16:00:00Z", updated_at: "2026-06-07T16:00:00Z", created_at: "2026-06-07T16:00:00Z",
    category: "update_tim", read_time: 4,
  },
];
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function getCategoryLabel(category: string | null): string {
  if (!category) return "";
  if (category === "unggulan") return "Unggulan";
  if (category === "turnamen") return "Turnamen";
  if (category === "update_tim") return "Update Tim";
  return category;
}

interface DarkCardProps {
  post: NewsPost;
  textPosition?: "top" | "bottom";
}

function DarkCard({ post, textPosition = "bottom" }: DarkCardProps) {
  const isTop = textPosition === "top";

  return (
    <Link
      href={`/news/${post.slug}`}
      className="lns-item group relative flex h-full w-full overflow-hidden rounded-2xl bg-[#030813]"
    >
      {post.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ filter: "brightness(0.4) saturate(0.65)" }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#111]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
      
      {/* Category badge */}
      {post.category && (
        <div className={`absolute z-20 ${isTop ? "bottom-4 left-4" : "top-4 left-4"}`}>
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-bold text-[#D4FF00] uppercase tracking-wider border border-white/5">
            {getCategoryLabel(post.category)}
          </span>
        </div>
      )}

      {/* Text overlay */}
      <div className={`absolute inset-x-4 flex flex-col gap-1 z-25 ${isTop ? "top-4" : "bottom-4"}`}>
        <div className="flex items-center gap-1.5 text-[9px] text-white/50 font-orbitron uppercase tracking-wider">
          <span>{formatDate(post.published_at)}</span>
          {post.read_time && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{post.read_time} Min Baca</span>
            </>
          )}
        </div>
        <p className="font-bebas text-lg uppercase leading-tight text-white transition-colors group-hover:text-[#D4FF00]">
          {post.title}
        </p>
      </div>
    </Link>
  );
}

const LatestNewsSection = ({ posts }: Props) => {
  const sectionRef = useRef<HTMLElement>(null);
  
  // Combine real posts with dummy posts to guarantee 7 cards in the grid without duplicates
  const postSlugs = new Set(posts.map((p) => p.slug));
  const postIds = new Set(posts.map((p) => p.id));
  const filteredDummies = DUMMY_POSTS.filter((d) => !postSlugs.has(d.slug) && !postIds.has(d.id));
  const data = [...posts, ...filteredDummies].slice(0, 7);

  // Grid slots: a=data[0], b=data[1](featured), c=data[2], d=data[3](tall), e=data[4], f=data[5], g=data[6]
  const [a, b, c, d, e, f, g] = data;

  useGSAP(() => {
    gsap.from(".lns-header", {
      y: 16, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
    gsap.from(".lns-item", {
      y: 20, opacity: 0, duration: 0.5, stagger: 0.07, ease: "power2.out",
      scrollTrigger: { trigger: ".lns-item", start: "top 88%", once: true },
    });
  }, { scope: sectionRef });

  if (data.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#020202] px-5 py-20 sm:px-8 lg:px-10 border-t border-white/5"
    >
      <div className="relative mx-auto max-w-7xl">

        {/* ── Header (artikel unggulan style) ─────────────────────────── */}
        <div className="lns-header mb-8 flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-bebas text-5xl sm:text-6xl font-black uppercase tracking-wide text-white leading-none">
            News
          </h2>
          <div className="flex flex-col items-end gap-1 text-right max-w-xs">
            <p className="text-sm text-white/40 font-sans leading-relaxed">
              Denyut nadi cerita kami,<br />
              disampaikan satu postingan demi satu.
            </p>
            <Link
              href="/news"
              className="mt-1 font-orbitron text-[9px] font-bold uppercase tracking-widest text-[#D4FF00]/60 transition hover:text-[#D4FF00]"
            >
              Lihat Semua →
            </Link>
          </div>
        </div>

        {/* ── MOBILE: simple 2-col grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
          {data.slice(0, 6).map((post) => (
            <div key={post.id} className="h-52">
              <DarkCard post={post} />
            </div>
          ))}
        </div>

        {/* ── DESKTOP: bento grid (Staggered Heights layout) ─────────── */}
        <div
          className="hidden lg:grid gap-3"
          style={{
            gridTemplateColumns: "1fr 1.7fr 1.15fr 1.55fr",
          }}
        >

          {/* Column 1 */}
          <div className="flex flex-col gap-3">
            <div className="h-[370px]">
              {a && <DarkCard post={a} textPosition="bottom" />}
            </div>
            <div className="h-[230px]">
              {e && <DarkCard post={e} textPosition="top" />}
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-3">
            <div className="h-[230px]">
              {b && (
                <Link
                  href={`/news/${b.slug}`}
                  className="lns-item group relative flex h-full w-full overflow-hidden rounded-2xl bg-[#D4FF00]"
                >
                  {b.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.cover_image_url}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-between p-7 z-20">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-orbitron text-[8px] font-bold uppercase tracking-widest text-black/40">
                        {getCategoryLabel(b.category) || "Featured"}{" // "}{formatDate(b.published_at)}
                      </span>
                      {b.read_time && (
                        <span className="font-orbitron text-[8px] font-bold uppercase tracking-widest text-black/40">
                          {b.read_time} Min Baca
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bebas text-3xl sm:text-4xl font-black uppercase tracking-wide text-black leading-tight group-hover:opacity-70 transition-opacity">
                        {b.title}
                      </h3>
                      {b.excerpt && (
                        <p className="mt-2 text-[11px] font-sans leading-relaxed text-black/55 line-clamp-2">
                          {b.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )}
            </div>
            <div className="h-[370px]">
              {f && <DarkCard post={f} textPosition="top" />}
            </div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-3">
            <div className="h-[230px]">
              {c && <DarkCard post={c} textPosition="bottom" />}
            </div>
            <div className="h-[370px]">
              {g && <DarkCard post={g} textPosition="top" />}
            </div>
          </div>

          {/* Column 4 */}
          <div className="flex flex-col gap-3">
            <div className="h-[612px]">
              {d && <DarkCard post={d} textPosition="top" />}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export { LatestNewsSection };
