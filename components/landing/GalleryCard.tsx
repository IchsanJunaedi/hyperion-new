"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

interface GalleryCardProps {
  index: number;
  slug: string;
  title: string;
  division: string;
  tournamentDate: string;
  position: string;
  logoUrl: string | null;
  previewImages: string[];
  total: number;
}

const GalleryCard = ({
  index,
  slug,
  title,
  division,
  tournamentDate,
  position,
  logoUrl,
  previewImages,
  total,
}: GalleryCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bgImage = previewImages[0] ?? null;
  const counter = String(index + 1).padStart(2, "0");
  const totalStr = String(total).padStart(2, "0");

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(48px)",
        transition: `opacity 0.65s ease ${index * 0.12}s, transform 0.65s ease ${index * 0.12}s`,
      }}
    >
      {/* Background image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#030914]">
        {bgImage && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgImage}
            alt=""
            onError={handleImgError}
            className="h-full w-full object-cover grayscale transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:scale-105 scale-100"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(135deg, #0d1b2e 0%, #1a2a40 60%, #0a1520 100%)",
            }}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030914] via-[#030914]/50 to-[#030914]/10" />

        {/* Border glow on hover */}
        <div className="absolute inset-0 border border-white/8 transition-colors duration-300 group-hover:border-[#F5C400]/40" />

        {/* Counter top-left */}
        <div className="absolute left-5 top-5 flex items-baseline gap-1">
          <span className="font-mono text-[11px] font-bold tracking-widest text-[#F5C400]">
            {counter}
          </span>
          <span className="font-mono text-[9px] text-white/30">/ {totalStr}</span>
        </div>

        {/* Logo top-right */}
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="absolute right-4 top-4 h-10 w-10 object-contain opacity-80"
          />
        )}

        {/* Content bottom */}
        <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col gap-2">
          {/* Position badge */}
          <span className="inline-block w-fit font-mono text-[10px] font-black uppercase tracking-[0.25em] text-[#F5C400]">
            {position}
          </span>

          {/* Title */}
          <h3 className="font-bebas text-2xl sm:text-3xl font-black uppercase leading-tight tracking-wide text-white group-hover:text-[#F5C400] transition-colors duration-200">
            {title}
          </h3>

          {/* Meta */}
          <p className="font-orbitron text-[9px] font-semibold uppercase tracking-widest text-white/40">
            {division} · {tournamentDate}
          </p>

          {/* CTA */}
          <div className="mt-2">
            <Link
              href={`/gallery/${slug}`}
              className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/60 transition-all duration-200 hover:border-[#F5C400]/50 hover:text-[#F5C400] hover:gap-3"
            >
              View More
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export { GalleryCard };
