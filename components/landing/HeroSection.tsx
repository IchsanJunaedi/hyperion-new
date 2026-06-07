"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap, useGSAP } from "@/lib/gsap";
import type { FeaturedTournament } from "@/features/admin/queries";
import { GridTexture, PlusTexture, GoldRadialGlow } from "@/components/landing/LandingTextures";

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
  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const achievementRef = useRef<HTMLSpanElement>(null);
  const rankRef = useRef<HTMLSpanElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused]);

  const goTo = (i: number) => {
    setCurrent(i);
    setPaused(true);
    setTimeout(() => setPaused(false), 8000);
  };

  // GSAP: crossfade slide backgrounds
  useGSAP(() => {
    if (!heroBackground && bgRefs.current.length > 0) {
      bgRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.to(el, {
          opacity: i === current ? 1 : 0,
          duration: 1.6,
          ease: "power1.inOut",
          overwrite: "auto",
        });
      });
    }
  }, [current, heroBackground]);

  // GSAP: animate bottom bar text on slide change
  useGSAP(() => {
    [achievementRef.current, rankRef.current].forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.25, delay: i * 0.04, ease: "power2.out" }
      );
    });
  }, [current]);

  // GSAP: hero entrance animation
  useGSAP(() => {
    gsap.from(".hero-content", {
      y: 30,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      delay: 0.2,
    });
  }, { scope: sectionRef });

  if (slides.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative flex min-h-screen flex-col overflow-hidden bg-[#0A0A0A]">
      {/* Texture overlays */}
      <GridTexture opacity={0.035} />
      <PlusTexture opacity={0.02} />
      <GoldRadialGlow from="top" intensity={0.06} />

      {/* Background */}
      {heroBackground ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroBackground}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            style={{ opacity: hasTournament ? 0.45 : 0.18 }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.6) 100%)" }} />
        </div>
      ) : (
        /* Slides — all in DOM, GSAP crossfades opacity */
        slides.map((slide, i) => (
          <div
            key={slide.image}
            ref={(el: HTMLDivElement | null) => { bgRefs.current[i] = el; }}
            className="absolute inset-0"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              style={{
                opacity: hasTournament ? 0.22 : 0.07,
                filter: "grayscale(100%)",
              }}
            />
          </div>
        ))
      )}

      {/* Header spacer */}
      <div className="h-14 shrink-0" />

      {/* Countdown or wordmark */}
      {hasTournament ? (
        <div className="hero-content flex flex-1 items-center justify-center px-5 sm:px-8 lg:px-10">
          <div className="w-full max-w-3xl border border-[#F5C400]/15 bg-white/[0.03] px-8 py-10 backdrop-blur-sm sm:px-12 sm:py-14">
            <HeroCountdown tournaments={featuredTournaments} />
          </div>
        </div>
      ) : (
        <div className="hero-content flex flex-1 items-end px-5 pb-8 sm:px-8 lg:px-10">
          <div className="max-w-5xl">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.5em] text-white/28">
              {settings.hero_eyebrow}
            </p>
            <h1
              className="font-black uppercase leading-[0.88] tracking-tighter text-white"
              style={{ fontSize: "clamp(3.4rem, 12vw, 10.5rem)" }}
            >
              HYPERION
              <br />
              <span className="text-[#F5C400]">{"// TEAM"}</span>
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-6 sm:mt-10">
              <p className="text-sm text-white/35">{settings.hero_tagline}</p>
              <div className="flex items-center gap-5">
                <Link
                  href={settings.hero_cta_href}
                  className="inline-flex h-10 items-center border border-[#F5C400] px-6 text-[11px] font-black uppercase tracking-widest text-[#F5C400] shadow-[0_0_0_rgba(245,196,0,0)] transition duration-200 hover:bg-[#F5C400] hover:text-black hover:shadow-[0_0_20px_rgba(245,196,0,0.25)]"
                >
                  {settings.hero_cta_label}
                </Link>
                <Link
                  href="#achievements"
                  className="text-[11px] font-bold uppercase tracking-widest text-white/35 transition hover:text-white"
                >
                  Explore ↓
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom info bar */}
      {!hasTournament && (
        <div className="relative z-10 border-t border-[#F5C400]/8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 px-5 sm:grid-cols-4 sm:px-8 lg:px-10">
              <div className="flex h-12 items-center border-r border-white/6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/28">Esports Team</span>
              </div>
              <div className="relative flex h-12 items-center overflow-hidden px-4 sm:border-r sm:border-white/6">
                <span ref={achievementRef} className="absolute text-[10px] font-bold uppercase tracking-widest text-white/28">
                  {slides[current]?.achievement ?? ""}
                </span>
              </div>
              <div className="hidden h-12 items-center px-4 sm:flex sm:border-r sm:border-white/6">
                <span ref={rankRef} className="text-[10px] font-bold uppercase tracking-widest text-white/28">
                  {slides[current]?.rank ?? ""}
                </span>
              </div>
              <div className="flex h-12 items-center justify-end gap-4 pl-4">
                <div className="flex items-center gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Slide ${i + 1}`}
                      className="cursor-pointer py-2"
                    >
                      <div
                        className="h-px rounded-full transition-all duration-300"
                        style={{
                          width: i === current ? 22 : 8,
                          background: i === current ? "rgb(245,196,0)" : "rgba(255,255,255,0.2)",
                        }}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[10px] tabular-nums text-white/28">
                  <span className="text-white/70">{String(current + 1).padStart(2, "0")}</span>
                  {" / "}
                  {String(slides.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
export { HeroSection };
