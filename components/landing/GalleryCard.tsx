"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

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
  metricValue?: string | null;
  metricLabel?: string | null;
  description: string;
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
  metricValue,
  metricLabel,
  description,
}: GalleryCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(false);
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  useGSAP(() => {
    if (!imgRef.current || !ref.current) return;
    gsap.fromTo(imgRef.current,
      { yPercent: -10, scale: 1.2 },
      {
        yPercent: 10,
        scale: 1.0,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        }
      }
    );
  }, { scope: ref });

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
      className="group relative border-b border-[#2D2D2D]/60 py-16 first:pt-0 last:border-b-0"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(48px)",
        transition: `opacity 0.75s ease ${index * 0.12}s, transform 0.75s ease ${index * 0.12}s`,
      }}
    >
      <div className="flex flex-col md:flex-row items-start gap-10 md:gap-16 lg:gap-20">
        {/* Left Column: Image with premium hover effects & parallax */}
        <div className="relative w-full md:w-[66%] aspect-[16/11] overflow-hidden rounded bg-[#141414] border border-white/5 shrink-0">
          {bgImage && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={bgImage}
              alt={title}
              onError={handleImgError}
              className="absolute top-[-10%] left-0 w-full h-[120%] object-cover grayscale-[20%] transition-grayscale duration-700 ease-out group-hover:grayscale-0"
            />
          ) : (
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                background:
                  "linear-gradient(135deg, #0d1b2e 0%, #1a2a40 60%, #0a1520 100%)",
              }}
            />
          )}

          {/* Logo overlay on image (top-right) if present */}
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="absolute right-4 top-4 h-10 w-10 object-contain opacity-70 bg-[#070707]/60 p-1 rounded-full backdrop-blur-sm"
            />
          )}

          {/* Status Badge overlay (top-left) */}
          <div className="absolute left-4 top-4 bg-[#F5C400] text-black font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm z-10">
            {position}
          </div>
        </div>

        {/* Right Column: Text & Metric details */}
        <div className="w-full md:w-[34%] flex flex-col justify-start">
          {/* Top category & index */}
          <div className="font-mono text-xs uppercase tracking-widest text-[#9B9A97] mb-3 flex items-center gap-2">
            <span>{division}</span>
            <span className="text-white/20">•</span>
            <span className="text-[#9B9A97]">{tournamentDate}</span>
            <span className="text-white/20">•</span>
            <span className="font-bold text-white/50">{counter}/{totalStr}</span>
          </div>

          {/* Title */}
          <h3 className="font-bebas text-3xl sm:text-4xl lg:text-5xl font-black uppercase leading-[1.1] tracking-wide text-white group-hover:text-[#F5C400] transition-colors duration-300 mb-4">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm sm:text-base leading-relaxed text-[#9B9A97] mb-6">
            {description}
          </p>

          {/* Metric block (if set) */}
          {metricValue && (
            <div className="px-5 py-4 bg-white/[0.02] backdrop-blur-md rounded-lg my-6 shadow-lg">
              <div className="font-bebas text-3xl sm:text-4xl font-black text-[#F5C400] tracking-tight">
                {metricValue}
              </div>
              {metricLabel && (
                <div className="text-xs sm:text-sm text-[#E5E2E1] font-semibold mt-0.5">
                  {metricLabel}
                </div>
              )}
            </div>
          )}

          {/* CTA Link Button */}
          <div className="mt-2">
            <Link
              href={`/gallery/${slug}`}
              className="inline-flex items-center gap-2 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white/80 transition-all duration-300 hover:bg-[#F5C400]/10 hover:text-[#F5C400] hover:gap-3 rounded"
            >
              View Details
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export { GalleryCard };
