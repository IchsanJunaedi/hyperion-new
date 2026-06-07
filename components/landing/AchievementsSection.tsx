"use client";

import { useRef, useState, useEffect } from "react";
import { X, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { gsap } from "gsap";
import type { Achievement } from "@/features/admin/queries";
import { GridTexture, GoldRadialGlow } from "@/components/landing/LandingTextures";

export type AchievementItem = Achievement & { href?: string };

const FALLBACK_PORTRAITS = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop"
];

const PLACEMENT_LABEL: Record<number, string> = { 1: "Champion", 2: "Runner Up", 3: "3rd Place" };

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
          <img src={src} alt={title} className="max-h-[85vh] max-w-[88vw] rounded-xl object-contain shadow-2xl" />
          {title && <p className="mt-3 text-center text-sm font-semibold text-white/60">{title}</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface CardProps {
  item: AchievementItem;
  index: number;
  onImageClick: (src: string, title: string) => void;
}

const AchievementCard = ({ item, index, onImageClick }: CardProps) => {
  const fallbackImage = FALLBACK_PORTRAITS[index % FALLBACK_PORTRAITS.length] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop";
  const imageSrc = item.image_url || fallbackImage;

  const handleClick = () => {
    if (item.image_url) {
      onImageClick(item.image_url, item.title);
    } else if (item.href) {
      window.location.href = item.href;
    } else {
      onImageClick(imageSrc, item.title);
    }
  };

  const label = item.placement ? (PLACEMENT_LABEL[item.placement] ?? `Juara ${item.placement}`) : "Achievement";

  // Parse description sentences into a list of highlights (maximum 3 points)
  const getBulletPoints = (desc: string | null) => {
    if (!desc) {
      return [
        "Kerja keras & dedikasi tim",
        "Hasrat tiada henti untuk menang",
        "Puncak kompetisi esports"
      ];
    }
    // Split by period, semicolon, or newline
    let parts = desc.split(/[.;\n]+/).map(p => p.trim()).filter(p => p.length > 3);
    
    // If we only have 1 part and it is long, try splitting by comma
    if (parts.length <= 1) {
      parts = desc.split(/[,;\n]+/).map(p => p.trim()).filter(p => p.length > 3);
    }
    
    return parts.slice(0, 3);
  };

  const points = getBulletPoints(item.description);

  return (
    <div
      className="achievement-card-wrapper shrink-0 select-none py-10"
      style={{ transform: "translateY(0px) scale(0.95)" }}
    >
      <div
        onClick={handleClick}
        className="group relative w-[280px] sm:w-[320px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-[#030813] shadow-2xl transition-all duration-500 hover:border-[#D4FF00]/40 hover:-translate-y-3 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
      >
        {/* Background photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={item.title}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105"
        />

        {/* Dark gradient overlay for typography readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-95 z-10" />

        {/* Top left placement subtag */}
        <div className="absolute top-6 left-6 z-20">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">
            {label}{" // "}{item.achieved_at.slice(0, 4)}
          </span>
        </div>

        {/* Bottom card details */}
        <div className="absolute inset-x-6 bottom-6 z-20 flex flex-col text-left">
          <span className="font-serif italic text-white/40 text-xs mb-1">glory{" //"}</span>
          <h3 className="font-sans font-bold text-lg sm:text-xl text-white tracking-wide uppercase leading-tight mb-2">
            {item.title}
          </h3>

          <div className="h-[1px] bg-white/10 w-full mb-3" />

          <div className="space-y-1.5">
            <span className="font-serif italic text-white/40 text-[11px] block">highlights{" //"}</span>
            <ul className="space-y-1.5 text-left">
              {points.map((pt, idx) => (
                <li key={idx} className="font-sans font-light text-white/80 text-[11px] leading-relaxed flex items-start gap-1.5">
                  <span className="text-[#D4FF00] font-sans text-xs select-none mt-0.5">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);

  // Drag-to-scroll implementation
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setIsDown(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const container = scrollContainerRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag speed multiplier
    container.scrollLeft = scrollLeft - walk;
  };

  // GSAP scroll wave effect listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateWave = () => {
      const cards = container.querySelectorAll(".achievement-card-wrapper");
      if (cards.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const range = containerRect.width * 0.7; // Width range of wave effect

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distanceFromCenter = Math.abs(cardCenter - containerCenter);

        // Wave factor goes from 1 (center) to 0 (borders)
        const factor = Math.max(0, 1 - distanceFromCenter / range);
        const curve = Math.sin((factor * Math.PI) / 2);

        // Translate up by up to 90px in the center, and scale from 0.95 to 1.0
        const translateY = curve * -90;
        const scale = 0.95 + curve * 0.05;

        gsap.to(card, {
          y: translateY,
          scale: scale,
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
    };

    // Initialize layout positions
    updateWave();

    container.addEventListener("scroll", updateWave, { passive: true });
    window.addEventListener("resize", updateWave);
    
    // Sync periodically to avoid layout shifts or delayed mounts
    const interval = setInterval(updateWave, 250);

    return () => {
      container.removeEventListener("scroll", updateWave);
      window.removeEventListener("resize", updateWave);
      clearInterval(interval);
    };
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <>
      <section
        ref={sectionRef}
        id="achievements"
        className="relative scroll-mt-14 overflow-hidden bg-[#020202] px-5 py-28 sm:px-8 lg:px-10 border-t border-white/5"
      >
        <GridTexture opacity={0.02} />
        <GoldRadialGlow from="center" intensity={0.03} />

        <div className="relative mx-auto max-w-7xl">
          
          {/* Header Typography */}
          <div className="mb-16 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-[#D4FF00]" />
              <p className="font-orbitron text-[9px] font-bold uppercase tracking-[0.3em] text-[#D4FF00]">
                Trophy Room
              </p>
              <div className="h-px w-8 bg-[#D4FF00]" />
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-wide leading-tight">
              The beginning of our <span className="italic">glory.</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xs sm:text-sm text-white/50 font-sans font-light leading-relaxed">
              Kita mulai dari apa yang paling kita impikan – bermain lebih gigih, berlatih lebih cerdas, menyatu lebih dalam, berpikir lebih jernih, dan menang bersama di setiap panggung kompetisi.
            </p>
          </div>

          {/* Staggered Wave Scroll Container */}
          <div className="relative w-full overflow-hidden">
            <div
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`flex gap-6 overflow-x-auto scrollbar-none px-4 sm:px-8 pt-32 pb-16 transition-all select-none ${
                isDown ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={{ scrollBehavior: isDown ? "auto" : "smooth" }}
            >
              {entries.map((item, i) => (
                <AchievementCard
                  key={item.id}
                  item={item}
                  index={i}
                  onImageClick={(src, title) => setLightbox({ src, title })}
                />
              ))}
            </div>
            
            {/* Scroll Indicator */}
            {entries.length > 3 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-white/30 text-[10px] font-orbitron uppercase tracking-widest pointer-events-none">
                <span>Drag to explore</span>
                <ArrowRight className="h-3 w-3 animate-pulse" />
              </div>
            )}
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
