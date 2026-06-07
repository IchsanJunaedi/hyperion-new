"use client";

import { useRef, useEffect } from "react";
import { ArrowRight } from "lucide-react";
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

interface CardProps {
  item: AchievementItem;
  index: number;
}

const AchievementCard = ({ item, index }: CardProps) => {
  const fallbackImage = FALLBACK_PORTRAITS[index % FALLBACK_PORTRAITS.length] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop";
  const imageSrc = item.image_url || fallbackImage;

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
    let parts = desc.split(/[.;\n]+/).map(p => p.trim()).filter(p => p.length > 3);
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
          <span className="font-orbitron text-[9px] font-bold uppercase tracking-[0.15em] text-[#D4FF00]/70 mb-1">
            glory{" //"}
          </span>
          <h3 className="font-bebas text-2xl font-black uppercase tracking-wide text-white leading-none mb-2 mt-0.5">
            {item.title}
          </h3>

          <div className="h-[1px] bg-white/10 w-full mb-3" />

          <div className="space-y-1.5">
            <span className="font-orbitron text-[9px] font-bold uppercase tracking-[0.15em] text-white/40 block">
              highlights{" //"}
            </span>
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

  // Duplicate achievements list three times to form a seamless infinite wrap-around
  const duplicatedEntries = [...entries, ...entries, ...entries];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // Direct DOM interaction refs (eliminates React render overhead entirely during drag)
    const isDownRef = { current: false };
    const startXRef = { current: 0 };
    const scrollLeftRef = { current: 0 };
    const isDraggingRef = { current: false };
    const clickStartRef = { current: { x: 0, y: 0 } };
    
    // speed modifiers updated smoothly via vertical scroll direction
    const timeScaleRef = { current: 1.0 };
    const speed = 1.0; // Base marquee speed (px per frame)
    let singleCycleWidth = 0;

    const updateWave = () => {
      const cards = container.querySelectorAll(".achievement-card-wrapper");
      if (cards.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const range = containerRect.width * 0.7;

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distanceFromCenter = Math.abs(cardCenter - containerCenter);

        const factor = Math.max(0, 1 - distanceFromCenter / range);
        const curve = Math.sin((factor * Math.PI) / 2);

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

    const measureDimensions = () => {
      const cards = container.querySelectorAll(".achievement-card-wrapper");
      if (cards.length < entries.length * 2) return;
      const firstCard = cards[0] as HTMLElement;
      const boundaryCard = cards[entries.length] as HTMLElement;
      if (firstCard && boundaryCard) {
        singleCycleWidth = boundaryCard.offsetLeft - firstCard.offsetLeft;
      }
      updateWave();
    };

    // Ticker logic for seamless, loop auto-scrolling
    const tick = () => {
      if (isDownRef.current || singleCycleWidth === 0) return;

      let newScroll = container.scrollLeft + speed * timeScaleRef.current;

      // Wrap around boundary limits
      if (newScroll >= singleCycleWidth) {
        newScroll -= singleCycleWidth;
      } else if (newScroll <= 0) {
        newScroll += singleCycleWidth;
      }

      container.scrollLeft = newScroll;
      updateWave();
    };

    // Drag-to-scroll implementations
    const startDrag = (pageX: number, pageY: number) => {
      clickStartRef.current = { x: pageX, y: pageY };
      isDraggingRef.current = false;

      container.style.cursor = "grabbing";
      isDownRef.current = true;
      startXRef.current = pageX - container.offsetLeft;
      scrollLeftRef.current = container.scrollLeft;
    };

    const moveDrag = (pageX: number, pageY: number) => {
      if (!isDownRef.current || singleCycleWidth === 0) return;
      
      const diffX = Math.abs(pageX - clickStartRef.current.x);
      const diffY = Math.abs(pageY - clickStartRef.current.y);
      if (diffX > 5 || diffY > 5) {
        isDraggingRef.current = true;
      }

      const walk = (pageX - container.offsetLeft - startXRef.current) * 1.5;
      let newScroll = scrollLeftRef.current - walk;

      if (newScroll >= singleCycleWidth) {
        newScroll -= singleCycleWidth;
        scrollLeftRef.current -= singleCycleWidth;
        startXRef.current += singleCycleWidth;
      } else if (newScroll <= 0) {
        newScroll += singleCycleWidth;
        scrollLeftRef.current += singleCycleWidth;
        startXRef.current -= singleCycleWidth;
      }

      container.scrollLeft = newScroll;
      updateWave();
    };

    const endDrag = () => {
      if (!isDownRef.current) return;
      isDownRef.current = false;
      container.style.cursor = "grab";
    };

    // Event listeners for Drag-to-Scroll
    const handleMouseDown = (e: MouseEvent) => startDrag(e.pageX, e.pageY);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDownRef.current) e.preventDefault();
      moveDrag(e.pageX, e.pageY);
    };
    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isCardClick = target.closest(".achievement-card-wrapper");
      
      // If it is a card and wasn't dragged, redirect to /gallery
      if (isCardClick && !isDraggingRef.current && isDownRef.current) {
        window.location.href = "/gallery";
      }
      endDrag();
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) startDrag(touch.pageX, touch.pageY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) moveDrag(touch.pageX, touch.pageY);
    };
    const handleTouchEnd = () => endDrag();

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    // Initial layouts
    container.style.cursor = "grab";
    
    const timer = setTimeout(() => {
      measureDimensions();
      gsap.ticker.add(tick);
    }, 100);

    window.addEventListener("resize", measureDimensions);

    // Page scroll direction tracking
    let lastScrollY = window.scrollY;
    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;
      if (diff > 0) {
        gsap.to(timeScaleRef, { current: 1.0, duration: 0.6, ease: "power1.out", overwrite: "auto" });
      } else if (diff < 0) {
        gsap.to(timeScaleRef, { current: -1.0, duration: 0.6, ease: "power1.out", overwrite: "auto" });
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureDimensions);
      window.removeEventListener("scroll", handleWindowScroll);
      gsap.ticker.remove(tick);

      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
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
            <h2 className="font-bebas text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-wide text-white leading-none">
              The beginning of our <span className="text-[#D4FF00]">glory.</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xs sm:text-sm text-white/50 font-sans font-light leading-relaxed">
              Kita mulai dari apa yang paling kita impikan – bermain lebih gigih, berlatih lebih cerdas, menyatu lebih dalam, berpikir lebih jernih, dan menang bersama di setiap panggung kompetisi.
            </p>
          </div>

          {/* Staggered Wave Scroll Container */}
          <div className="relative w-full overflow-hidden">
            <div
              ref={scrollContainerRef}
              onDragStart={(e) => e.preventDefault()}
              className="flex gap-6 overflow-x-hidden scrollbar-none px-4 sm:px-8 pt-32 pb-16 select-none"
            >
              {duplicatedEntries.map((item, i) => {
                const setIndex = Math.floor(i / entries.length);
                const originalIndex = i % entries.length;
                return (
                  <AchievementCard
                    key={`${item.id}-${setIndex}-${originalIndex}`}
                    item={item}
                    index={originalIndex}
                  />
                );
              })}
            </div>
            
            {/* Action Tip indicator */}
            <div className="mt-4 flex items-center justify-center gap-2 text-white/20 text-[9px] font-orbitron uppercase tracking-widest pointer-events-none">
              <span>Press and drag to slide manually · Click cards to open gallery</span>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export { AchievementsSection };
