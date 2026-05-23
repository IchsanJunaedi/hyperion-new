import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { GALLERIES } from "@/lib/data/gallery";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GALLERIES.map((g) => ({ slug: g.slug }));
}

export default async function GalleryShowPage({ params }: Props) {
  const { slug } = await params;
  const gallery = GALLERIES.find((g) => g.slug === slug);

  if (!gallery) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#070707]">
        <section className="mx-auto max-w-3xl px-6 py-16 sm:px-10">
          {/* Back */}
          <Link
            href="/gallery"
            className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/30 transition hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" /> Gallery
          </Link>

          {/* Title */}
          <h1 className="mb-6 text-2xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl">
            {gallery.title}
          </h1>

          {/* Main image */}
          {gallery.preview_images[0] && (
            <div className="mb-8 overflow-hidden rounded-lg border border-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery.preview_images[0]}
                alt={gallery.title}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Meta info */}
          <div className="mb-8 space-y-2 border-l-2 border-[#F5C400]/40 pl-4 text-sm">
            <p className="font-semibold text-white/70">
              Divisi Hyperion:{" "}
              <span className="text-white">{gallery.division}</span>
            </p>
            <p className="font-semibold text-white/70">
              Tanggal Tournament:{" "}
              <span className="text-white">{gallery.tournament_date}</span>
            </p>
            <p className="font-semibold text-white/70">
              Juara: <span className="text-[#F5C400]">{gallery.position}</span>
            </p>
            <p className="font-semibold text-white/70">
              Online/Offline:{" "}
              <span className="text-white">{gallery.status}</span>
            </p>
          </div>

          {/* Description */}
          <p className="text-justify text-sm leading-relaxed text-white/55 indent-8 sm:text-base">
            {gallery.description}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
