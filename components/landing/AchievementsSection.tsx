"use client";

import { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Achievement } from "@/features/admin/queries";
import { GridTexture, GoldRadialGlow } from "@/components/landing/LandingTextures";

export type AchievementItem = Achievement & { href?: string };

const PLACEMENT_LABEL: Record<number, string> = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };

const ImageLightbox = ({ src, title, onClose }: { src: string; title: string; onClose: () => void }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        <button type="button" onClick={onClose} className="absolute right-4 top-4 cursor-pointer text-white/50 transition hover:text-white" aria-label="Tutup">
          <X className="h-6 w-6" />
        </button>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative max-h-[90vh] max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={title} className="max-h-[85vh] max-w-[88vw] rounded object-contain shadow-2xl" />
          {title && <p className="mt-3 text-center text-sm font-semibold text-white/60">{title}</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface RowProps {
  item: AchievementItem;
  index: number;
  onImageClick: (src: string, title: string) => void;
}

const AchievementRow = ({ item, index, onImageClick }: RowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(rowRef.current, {
      y: 16,
      opacity: 0,
      duration: 0.5,
      delay: index * 0.06,
      ease: "power2.out",
      scrollTrigger: { trigger: rowRef.current, start: "top 90%", once: true },
    });
  }, { scope: rowRef });

  const isClickable = !!(item.image_url || item.href);

  const handleClick = () => {
    if (item.image_url) onImageClick(item.image_url, item.title);
    else if (item.href) window.location.href = item.href;
  };

  return (
    <div
      ref={rowRef}
      onClick={isClickable ? handleClick : undefined}
      style={isClickable ? { cursor: "pointer" } : undefined}
    >
      <div className={`group relative overflow-hidden border-b border-white/[0.06] transition-colors${isClickable ? " hover:bg-white/[0.03]" : ""}`}>
        {item.image_url && (
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" style={{ filter: "brightness(0.12) grayscale(60%)" }} />
          </div>
        )}
        <div className="relative grid grid-cols-[3rem_1fr] items-center gap-4 py-7 sm:grid-cols-[4rem_1fr_auto] sm:gap-8 sm:py-8">
          <span className="text-3xl font-black tabular-nums text-white/18 sm:text-4xl">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black uppercase leading-tight tracking-tight text-white sm:text-xl lg:text-2xl">
              {item.title}
            </h3>
            {item.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/55 sm:text-sm">
                {item.description}
              </p>
            )}
          </div>
          <div className="hidden flex-col items-end gap-2 sm:flex">
            {item.placement != null && (
              <span
                className="text-[11px] font-black uppercase tracking-widest text-[#F5C400]"
                style={item.placement === 1 ? { textShadow: "0 0 16px rgba(245,196,0,0.6)" } : undefined}
              >
                {PLACEMENT_LABEL[item.placement] ?? `Juara ${item.placement}`}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">
              {item.achieved_at.slice(0, 4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AchievementsSectionProps {
  entries: AchievementItem[];
}

const AchievementsSection = ({ entries }: AchievementsSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);

  useGSAP(() => {
    gsap.from(".ach-header", {
      y: 16, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
  }, { scope: sectionRef });

  if (entries.length === 0) return null;

  return (
    <>
      <section ref={sectionRef} id="achievements" className="relative scroll-mt-14 overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
        <GridTexture opacity={0.03} />
        <GoldRadialGlow from="center" intensity={0.04} />
        <div className="relative mx-auto max-w-7xl">
          <div className="ach-header mb-0 pb-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-4 w-0.5 bg-[#F5C400]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">Trophy Room</p>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Our Achievement
                </h2>
              </div>
            </div>
          </div>
          <div>
            {entries.map((item, i) => (
              <AchievementRow
                key={item.id}
                item={item}
                index={i}
                onImageClick={(src, title) => setLightbox({ src, title })}
              />
            ))}
          </div>
        </div>
      </section>
      {lightbox && (
        <ImageLightbox src={lightbox.src} title={lightbox.title} onClose={() => setLightbox(null)} />
      )}
    </>
  );
};
export { AchievementsSection };
