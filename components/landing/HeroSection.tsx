"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
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

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);

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

  if (slides.length === 0) return null;

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      {/* Background */}
      {heroBackground ? (
        /* Custom uploaded background — full color, higher opacity */
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroBackground}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            style={{ opacity: hasTournament ? 0.45 : 0.18 }}
          />
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)" }} />
        </div>
      ) : (
        /* Fallback — gallery slides, grayscale, barely visible */
        <AnimatePresence mode="sync">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slides[current]?.image ?? ""}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              style={{
                opacity: hasTournament ? 0.22 : 0.07,
                filter: "grayscale(100%)",
              }}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Header spacer */}
      <div className="h-14 shrink-0" />

      {/* Tournament countdown — shown fullscreen, hides wordmark */}
      {hasTournament ? (
        <div className="flex flex-1 items-center justify-center px-5 sm:px-8 lg:px-10">
          <HeroCountdown tournaments={featuredTournaments} />
        </div>
      ) : (
        /* Main content — bottom-left aligned like CHEW */
        <div className="flex flex-1 items-end px-5 pb-8 sm:px-8 lg:px-10">
          <div className="max-w-5xl">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.5em] text-white/28">
              {settings.hero_eyebrow}
            </p>

            {/* Massive wordmark */}
            <h1
              className="font-black uppercase leading-[0.88] tracking-tighter text-white"
              style={{ fontSize: "clamp(3.4rem, 12vw, 10.5rem)" }}
            >
              HYPERION
              <br />
              <span className="text-[#F5C400]">{'// TEAM'}</span>
            </h1>

            <div className="mt-8 flex flex-wrap items-center gap-6 sm:mt-10">
              <p className="text-sm text-white/35">
                {settings.hero_tagline}
              </p>
              <div className="flex items-center gap-5">
                <Link
                  href={settings.hero_cta_href}
                  className="inline-flex h-10 items-center border border-[#F5C400] px-6 text-[11px] font-black uppercase tracking-widest text-[#F5C400] transition duration-200 hover:bg-[#F5C400] hover:text-black"
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

      {/* CHEW-style bottom info bar — hidden when countdown is active */}
      {!hasTournament && <div className="relative z-10 border-t border-white/8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 px-5 sm:grid-cols-4 sm:px-8 lg:px-10">
            {/* Tagline */}
            <div className="flex h-12 items-center border-r border-white/6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/28">
                Esports Team
              </span>
            </div>

            {/* Achievement (animates per slide) */}
            <div className="relative flex h-12 items-center overflow-hidden px-4 sm:border-r sm:border-white/6">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`ach-${current}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute text-[10px] font-bold uppercase tracking-widest text-white/28"
                >
                  {slides[current]?.achievement ?? ""}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Rank */}
            <div className="hidden h-12 items-center px-4 sm:flex sm:border-r sm:border-white/6">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`rank-${current}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut", delay: 0.04 }}
                  className="text-[10px] font-bold uppercase tracking-widest text-white/28"
                >
                  {slides[current]?.rank ?? ""}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Counter + dot indicators */}
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
                    <motion.div
                      animate={{
                        width: i === current ? 22 : 8,
                        background:
                          i === current
                            ? "rgb(245,196,0)"
                            : "rgba(255,255,255,0.2)",
                      }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="h-px rounded-full"
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
      </div>}
    </section>
  );
};
export { HeroSection };
