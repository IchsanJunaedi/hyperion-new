import Link from "next/link";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";

interface GalleryEntry {
  slug: string;
  title: string;
  division: string;
  tournament_date: string;
  position: string;
  status: string;
  logo: string | null;
  preview_images: string[];
  description: string;
}

export const GALLERIES: GalleryEntry[] = [
  {
    slug: "liga-esport-nasional-pelajar-2024",
    title: "Liga Esport Nasional Pelajar 2024",
    division: "Mobile Legends: Bang Bang",
    tournament_date: "2024",
    position: "Juara 1",
    status: "Online",
    logo: null,
    preview_images: [
      "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
    ],
    description:
      "Ini dia SANG JUARA LIGA ESPORTS NASIONAL PELAJAR 2024 - MOBILE LEGENDS. Perjuangan keras tidak mengkhianati hasil dari kerjasama tim. Tetap semangat dan semoga bisa terus mendapatkan juara.",
  },
  {
    slug: "rrq-mabar-esports-tournament-season-4",
    title: "RRQ MABAR Esports Tournament Season 4",
    division: "Mobile Legends: Bang Bang",
    tournament_date: "2024",
    position: "Champion",
    status: "Online",
    logo: null,
    preview_images: [
      "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
    ],
    description:
      "Ribuan pelajar telah bertanding di RRQ MABAR Esports Tournament Season 4 dan inilah juaranya! SMAS Xaverius 1 Palembang berhasil raih back to back champion setelah menang 3-1 di Grand Final melawan SMAK Yos Sudarso Batam.",
  },
  {
    slug: "h3ro-rookie-tournament-4",
    title: "H3RO ROOKIE TOURNAMENT 4.0",
    division: "Mobile Legends: Bang Bang",
    tournament_date: "2023",
    position: "Champion",
    status: "Offline",
    logo: null,
    preview_images: [
      "https://hyperionteam.id/storage/timelines/01JZPD3RM26KW2BNB68WFYTT6X.jpeg",
    ],
    description:
      "H3RO Esports 4.0 is the 4th edition of the event organized by H3RO. Champion qualifies to Seleknas IESF 2023.",
  },
];

export default function GalleryPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#070707]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                Highlights
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              GALLERY
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/40">
              Momen-momen terbaik Hyperion Team di berbagai turnamen nasional dan regional.
            </p>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {GALLERIES.map((gallery) => (
                <div
                  key={gallery.slug}
                  className="relative flex flex-col border border-white/5 bg-[#0D0D0D] p-5"
                >
                  {/* Title + logo */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white leading-snug flex-1">
                      {gallery.title}
                    </h3>
                    {gallery.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={gallery.logo}
                        alt="Logo"
                        className="h-12 w-12 shrink-0 object-contain"
                      />
                    )}
                  </div>

                  {/* Meta */}
                  <ul className="mb-4 space-y-1 text-xs text-white/40">
                    <li>Divisi Hyperion: {gallery.division}</li>
                    <li>Tanggal Tournament: {gallery.tournament_date}</li>
                    <li>Juara: {gallery.position}</li>
                    <li>Online/Offline: {gallery.status}</li>
                  </ul>

                  {/* Preview images */}
                  <div className="mb-16 grid grid-cols-2 gap-2">
                    {gallery.preview_images.map((src, i) => (
                      <div
                        key={i}
                        className="aspect-video overflow-hidden bg-white/5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`${gallery.title} ${i + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    {/* Fill empty slot if only 1 image */}
                    {gallery.preview_images.length === 1 && (
                      <div className="aspect-video bg-white/[0.03]" />
                    )}
                  </div>

                  {/* View More */}
                  <div className="absolute bottom-5 right-5">
                    <Link
                      href={`/gallery/${gallery.slug}`}
                      className="inline-flex items-center border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/50 transition hover:border-[#F5C400]/40 hover:text-[#F5C400]"
                    >
                      View More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
