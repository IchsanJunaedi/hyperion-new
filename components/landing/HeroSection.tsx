"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap, useGSAP } from "@/lib/gsap";
import type { FeaturedTournament } from "@/features/admin/queries";

const HeroCountdown = dynamic(
  () => import("@/components/landing/HeroCountdown").then((m) => ({ default: m.HeroCountdown })),
  { ssr: false }
);

export interface HeroSlide {
  image: string;
  achievement: string;
  rank: string;
  year: string;
}

export interface HeroSettings {
  hero_eyebrow: string;
  hero_tagline: string;
  hero_cta_label: string;
  hero_cta_href: string;
}

interface HeroSectionProps {
  slides: HeroSlide[];
  settings: HeroSettings;
  featuredTournaments?: FeaturedTournament[];
  heroBackground?: string | null;
}

const HeroSection = ({ slides, settings, featuredTournaments = [], heroBackground }: HeroSectionProps) => {
  const hasTournament = featuredTournaments.length > 0;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % Math.max(slides.length, 1)), [slides.length]);
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused, slides.length]);

  const goTo = (i: number) => { setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 8000); };

  const playerImage = slides[current]?.image || null;

  useGSAP(() => {
    gsap.from(".hero-line", { y: 50, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", delay: 0.15 });
    gsap.from(".hero-sub", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.55 });
    gsap.from(".hero-cta", { y: 16, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 0.7 });
    gsap.from(".hero-player", { x: 60, opacity: 0, duration: 1.1, ease: "power3.out", delay: 0.2 });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      {/* Background image */}
      {heroBackground && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroBackground}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            style={{ opacity: 0.28, filter: "grayscale(50%) brightness(0.55)" }}
          />
        </div>
      )}
      {/* Directional gradient: dark left (text), fade right (player) */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.88) 40%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.2) 100%)" }} />
      {/* Bottom fade */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 30%)" }} />
      {/* Gold radial glow top-left */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(245,196,0,0.07) 0%, transparent 65%)" }} />

      {/* Right side — player cutout OR decorative H lettermark */}
      <div className="hero-player absolute bottom-0 right-0 hidden h-full lg:block" style={{ width: "48%", zIndex: 2 }}>
        {playerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={playerImage}
            alt=""
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-[92%] w-auto max-w-full object-contain object-bottom"
            style={{ filter: "brightness(0.88) contrast(1.08)" }}
          />
        ) : (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 select-none leading-none">
            <span
              className="font-black uppercase text-[#F5C400]"
              style={{ fontSize: "clamp(200px, 26vw, 420px)", opacity: 0.05, letterSpacing: "-0.04em" }}
            >
              H
            </span>
          </div>
        )}
        {/* Right-side gold radial glow */}
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 100% at 80% 60%, rgba(245,196,0,0.06) 0%, transparent 65%)" }} />
      </div>

      {/* Header spacer */}
      <div className="h-16 shrink-0" />

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-5 pb-10 pt-6 sm:px-8 lg:px-10">
        {hasTournament ? (
          <div className="w-full max-w-2xl border border-[#F5C400]/15 bg-black/70 px-8 py-10">
            <HeroCountdown tournaments={featuredTournaments} />
          </div>
        ) : (
          <div className="max-w-[62%] lg:max-w-[55%]">
            <p className="hero-line mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-[#F5C400]/70">
              {settings.hero_eyebrow}
            </p>
            <h1
              className="hero-line font-black uppercase leading-[0.88] text-white"
              style={{ fontSize: "clamp(3.8rem, 10vw, 11rem)", letterSpacing: "-0.03em" }}
            >
              HYPERION
            </h1>
            <h1
              className="hero-line font-black uppercase leading-[0.88] text-[#F5C400]"
              style={{
                fontSize: "clamp(3.8rem, 10vw, 11rem)",
                letterSpacing: "-0.03em",
                textShadow: "0 0 80px rgba(245,196,0,0.22), 0 0 160px rgba(245,196,0,0.08)",
              }}
            >
              {"// TEAM"}
            </h1>
            <p className="hero-sub mt-5 max-w-sm text-[13px] leading-relaxed text-white/40 sm:text-sm">
              {settings.hero_tagline}
            </p>
            <div className="hero-cta mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={settings.hero_cta_href}
                className="clip-tr inline-flex h-11 cursor-pointer items-center bg-[#F5C400] px-8 text-[11px] font-black uppercase tracking-widest text-black transition-colors duration-200 hover:bg-white"
              >
                {settings.hero_cta_label}
              </Link>
              <Link
                href="#achievements"
                className="clip-tr inline-flex h-11 cursor-pointer items-center border border-white/20 px-8 text-[11px] font-bold uppercase tracking-widest text-white/60 transition-colors duration-200 hover:border-[#F5C400] hover:text-[#F5C400]"
              >
                Explore ↓
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Slide dots */}
      {!hasTournament && slides.length > 1 && (
        <div className="relative z-10 flex items-center justify-between border-t border-[#F5C400]/8 px-5 py-3 sm:px-8 lg:px-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            {slides[current]?.achievement ?? ""}
          </span>
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => goTo(i)} className="cursor-pointer py-2">
                <div
                  className="h-px rounded-full transition-all duration-300"
                  style={{ width: i === current ? 22 : 8, background: i === current ? "#F5C400" : "rgba(255,255,255,0.18)" }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gold diagonal stripe bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] overflow-hidden">
        <div className="h-full w-[108%] bg-[#F5C400]" style={{ marginLeft: "-4%", transform: "skewX(-8deg)", opacity: 0.75 }} />
      </div>
    </section>
  );
};
export { HeroSection };
