"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";

const WORDS_LINE1 = "WE ARE".split(" ");
const WORDS_TITLE = "HYPERION TEAM".split(" ");

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070707]">
      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(245,196,0,0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.22,
        }}
      />

      {/* Center glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(245,196,0,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Corner brackets */}
      <div className="absolute left-6 top-24 h-12 w-12 border-l-2 border-t-2 border-[#F5C400]/25 sm:left-10 sm:h-16 sm:w-16" />
      <div className="absolute bottom-12 right-6 h-12 w-12 border-b-2 border-r-2 border-[#F5C400]/25 sm:right-10 sm:h-16 sm:w-16" />

      {/* Main content — centered */}
      <div className="relative z-10 flex flex-col items-center px-6 py-28 text-center sm:px-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8 overflow-hidden rounded-2xl border border-[#F5C400]/15"
        >
          <Image
            src="/brand/logo.jpg"
            alt="Hyperion Team"
            width={88}
            height={88}
            className="h-20 w-20 object-cover sm:h-24 sm:w-24"
            priority
          />
        </motion.div>

        {/* WE ARE — word by word blur-in */}
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.55em] text-white/30 sm:text-sm">
          {WORDS_LINE1.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, filter: "blur(4px)", y: 8 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1, ease: "easeOut" }}
              className="mr-2 inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h2>

        {/* HYPERION TEAM — word by word blur-in */}
        <h1
          className="text-[clamp(2.8rem,10vw,7rem)] font-black uppercase leading-[0.9] tracking-tight text-[#F5C400]"
          style={{
            textShadow:
              "0 0 60px rgba(245,196,0,0.22), 0 0 120px rgba(245,196,0,0.08)",
          }}
        >
          {WORDS_TITLE.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.2 + i * 0.12,
                ease: "easeOut",
              }}
              className="mr-3 inline-block last:mr-0"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="mt-7 max-w-md text-sm leading-relaxed text-white/45 sm:text-base"
        >
          Empowering Young Talents to Rise and Rule.
          <br className="hidden sm:block" />
          Focused on Growth. Driven to Win.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.95 }}
          className="mt-10"
        >
          <Link
            href="#achievements"
            className="inline-flex h-12 items-center gap-2.5 bg-[#F5C400] px-9 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-yellow-300"
          >
            Explore Now
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-[9px] uppercase tracking-[0.35em] text-white/20">
          Scroll
        </span>
        <ChevronDown className="h-4 w-4 animate-bounce text-[#F5C400]/40" />
      </div>
    </section>
  );
}
