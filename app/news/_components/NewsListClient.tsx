import Link from "next/link";
import { ArrowRight, Calendar, Clock, Newspaper } from "lucide-react";
import type { NewsPost } from "@/features/admin/queries";


function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCategoryLabel(cat: string | null): string {
  const map: Record<string, string> = { berita: "Berita", update: "Update", pengumuman: "Pengumuman", opini: "Opini" };
  return map[cat ?? ""] ?? cat ?? "Berita";
}

const NewsListClient = ({ posts }: { posts: NewsPost[] }) => {
  const filtered = posts;

  const [featured, ...rest] = filtered;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 pb-24 pt-10 sm:px-10 lg:px-16">

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Newspaper className="h-8 w-8 text-white/15" />
          <p className="text-sm text-white/40">Tidak ada artikel ditemukan.</p>
        </div>
      ) : (
        <>
          {/* Featured article */}
          {featured && (
            <Link
              href={`/news/${featured.slug}`}
              className="group relative flex min-h-[400px] items-end overflow-hidden rounded-2xl border border-white/5"
            >
              {featured.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.cover_image_url}
                  alt={featured.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0C1E3C] to-[#040D1C]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              <div className="relative z-10 p-6 sm:p-10 w-full lg:w-2/3">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#F5C400] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#020202]">
                    Pilihan Editor
                  </span>
                  {featured.category && (
                    <span className="rounded-md border border-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                      {getCategoryLabel(featured.category)}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl group-hover:text-[#F5C400] transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">
                    {featured.excerpt}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-xs text-white/45">
                  {featured.published_at && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {formatDate(featured.published_at)}
                    </span>
                  )}
                  {featured.read_time && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {featured.read_time} mnt baca
                    </span>
                  )}
                </div>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F5C400]">
                  Baca selengkapnya
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition-all hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="relative h-48 overflow-hidden">
                    {post.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#0C1E3C]">
                        <Newspaper className="h-8 w-8 text-white/10" />
                      </div>
                    )}
                    {post.category && (
                      <div className="absolute left-3 top-3">
                        <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-sm">
                          {getCategoryLabel(post.category)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex items-center gap-3 text-[10px] text-white/35">
                      {post.published_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {formatDate(post.published_at)}
                        </span>
                      )}
                      {post.read_time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {post.read_time} mnt
                        </span>
                      )}
                    </div>
                    <h3 className="font-black uppercase leading-tight tracking-tight text-white transition group-hover:text-[#F5C400] line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="line-clamp-3 text-xs leading-relaxed text-white/40">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-auto pt-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#F5C400]/70 transition group-hover:text-[#F5C400]">
                        Baca
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export { NewsListClient };
