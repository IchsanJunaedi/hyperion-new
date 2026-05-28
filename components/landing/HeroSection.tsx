"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const SLIDES = [
  {
    image: "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
    tag: "Liga Esport Nasional 2024",
    line1: "RISE",
    line2: "ABOVE ALL",
  },
  {
    image: "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
    tag: "RRQ MABAR Season 4",
    line1: "BACK TO BACK",
    line2: "CHAMPIONS",
  },
  {
    image: "https://hyperionteam.id/storage/timelines/01JZPD3RM26KW2BNB68WFYTT6X.jpeg",
    tag: "H3RO Rookie Tournament 4.0",
    line1: "BORN TO",
    line2: "WIN",
  },
] as const;

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [next, paused]);

  const goTo = (i: number) => {
    setCurrent(i);
    setPaused(true);
    setTimeout(() => setPaused(false), 9000);
  };

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#050505]">
      {/* Background slide images */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SLIDES[current].image}
            alt={SLIDES[current].tag}
            className="h-full w-full object-cover object-center"
          />
          {/* Left-heavy gradient — keeps text readable */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(108deg, rgba(5,5,5,0.97) 20%, rgba(5,5,5,0.68) 55%, rgba(5,5,5,0.22) 100%)",
            }}
          />
          {/* Bottom fade */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(5,5,5,0.96) 0%, transparent 42%)",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dot-grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(245,196,0,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.16,
        }}
      />

      {/* Ambient left glow */}
      <div
        className="pointer-events-none absolute left-0 top-1/2 z-10 h-[600px] w-[480px] -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse, rgba(245,196,0,0.045) 0%, transparent 70%)",
        }}
      />

      {/* Corner brackets */}
      <div className="absolute left-6 top-24 z-20 h-10 w-10 border-l-2 border-t-2 border-[#F5C400]/18 sm:left-10 sm:h-14 sm:w-14" />
      <div className="absolute bottom-14 right-6 z-20 h-10 w-10 border-b-2 border-r-2 border-[#F5C400]/18 sm:right-10 sm:h-14 sm:w-14" />

      {/* Main content */}
      <div className="relative z-20 mx-auto w-full max-w-7xl px-6 pb-36 pt-40 sm:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-3xl"
          >
            {/* Live achievement tag */}
            <div
              className="mb-7 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5"
              style={{
                background: "rgba(245,196,0,0.07)",
                border: "1px solid rgba(245,196,0,0.22)",
                backdropFilter: "blur(12px)",
              }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F5C400]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#F5C400]">
                {SLIDES[current].tag}
              </span>
            </div>

            {/* Eyebrow */}
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.5em] text-white/22">
              We Are
            </p>

            {/* Main wordmark */}
            <h1 className="text-[clamp(2.6rem,8vw,6.5rem)] font-black uppercase leading-[0.88] tracking-tight">
              <span className="text-white">HYPERION</span>
              <br />
              <span
                className="text-[#F5C400]"
                style={{
                  textShadow:
                    "0 0 80px rgba(245,196,0,0.28), 0 0 200px rgba(245,196,0,0.1)",
                }}
              >
                TEAM
              </span>
            </h1>

            {/* Slide subtitle line */}
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-10 bg-[#F5C400]/32" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/35">
                {SLIDES[current].line1} {SLIDES[current].line2}
              </span>
            </div>

            {/* Description */}
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/38 sm:text-[15px]">
              Empowering Young Talents to Rise and Rule.
              <br />
              Focused on Growth. Driven to Win.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex h-12 items-center bg-[#F5C400] px-8 text-sm font-black uppercase tracking-wide text-black transition-all duration-300 hover:bg-yellow-300 hover:shadow-[0_0_40px_rgba(245,196,0,0.35)]"
              >
                Join Us
              </Link>
              <Link
                href="#achievements"
                className="inline-flex h-12 items-center gap-2 px-8 text-sm font-bold uppercase tracking-wide text-white/55 transition hover:text-white"
                style={{
                  border: "1px solid rgba(255,255,255,0.11)",
                  backdropFilter: "blur(12px)",
                  background: "rgba(255,255,255,0.025)",
                }}
              >
                Explore
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide indicators — bottom left */}
      <div className="absolute bottom-10 left-6 z-20 flex items-center gap-4 sm:left-10">
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="cursor-pointer py-2"
            >
              <motion.div
                animate={{
                  width: i === current ? 28 : 10,
                  background:
                    i === current
                      ? "rgb(245,196,0)"
                      : "rgba(255,255,255,0.18)",
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="h-[2px] rounded-full"
              />
            </button>
          ))}
        </div>
        <span className="text-[10px] tabular-nums text-white/20">
          {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
};
export { HeroSection };
