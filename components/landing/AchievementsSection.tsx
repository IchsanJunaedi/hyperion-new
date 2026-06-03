"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { motion, useInView, AnimatePresence } from "motion/react";
import type { Achievement } from "@/features/admin/queries";

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
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 cursor-pointer text-white/50 transition hover:text-white"
          aria-label="Tutup"
        >
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
          <img
            src={src}
            alt={title}
            className="max-h-[85vh] max-w-[88vw] rounded object-contain shadow-2xl"
          />
          {title && (
            <p className="mt-3 text-center text-sm font-semibold text-white/60">{title}</p>
          )}
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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const router = useRouter();

  const handleClick = () => {
    if (item.image_url) {
      onImageClick(item.image_url, item.title);
    } else if (item.href) {
      router.push(item.href);
    }
  };

  const isClickable = !!(item.image_url || item.href);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      onClick={isClickable ? handleClick : undefined}
      style={isClickable ? { cursor: "pointer" } : undefined}
    >
      <div className={`group relative overflow-hidden border-b border-white/8 transition-colors${isClickable ? " hover:bg-white/[0.02]" : ""}`}>
        {/* Hover-reveal photo */}
        {item.image_url && (
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-full w-full object-cover"
              style={{ filter: "brightness(0.12) grayscale(60%)" }}
            />
          </div>
        )}

        <div className="relative grid grid-cols-[3rem_1fr] items-center gap-4 py-7 sm:grid-cols-[4rem_1fr_auto] sm:gap-8 sm:py-8">
          <span className="text-3xl font-black tabular-nums text-white/12 sm:text-4xl">
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="min-w-0">
            <h3 className="text-base font-black uppercase leading-tight tracking-tight text-white sm:text-xl lg:text-2xl">
              {item.title}
            </h3>
            {item.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/32 sm:text-sm">
                {item.description}
              </p>
            )}
          </div>

          <div className="hidden flex-col items-end gap-2 sm:flex">
            {item.placement != null && (
              <span className="text-[11px] font-black uppercase tracking-widest text-[#F5C400]">
                {PLACEMENT_LABEL[item.placement] ?? `Juara ${item.placement}`}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/28">
              {item.achieved_at.slice(0, 4)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface AchievementsSectionProps {
  entries: AchievementItem[];
}

const AchievementsSection = ({ entries }: AchievementsSectionProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);

  if (entries.length === 0) return null;

  return (
    <>
      <section id="achievements" className="scroll-mt-14 bg-black px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-0 border-b border-white/8 pb-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">
                  01 — Trophy Room
                </p>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Our Achievement
                </h2>
              </div>
            </div>
          </motion.div>

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
        <ImageLightbox
          src={lightbox.src}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
};
export { AchievementsSection };
