# Landing Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully redesign all landing page components to match gamingonavax.com — dark near-black bg (#0A0A0A), glassmorphism cards, texture overlays (grid dots + plus pattern + gold radial glow), gold #F5C400 neon accent. Replace all section entrance animations with GSAP + ScrollTrigger.

**Architecture:** Each landing component rewritten in-place (same props/exports, same data-fetching). GSAP replaces motion/react for all landing section animations. motion/react stays for workspace UI and HeaderClient mobile drawer. One new shared file `components/landing/LandingTextures.tsx` for texture overlays. One new `lib/gsap.ts` barrel for GSAP + ScrollTrigger registration. CSS keyframes for partner carousel in `globals.css`.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, **GSAP 3 + @gsap/react** (new), motion/react (kept for workspace + header drawer), Lucide React, Supabase admin client (DivisionsSection only)

---

## Task 0: Install GSAP + create shared setup

**Files:**
- Modify: `package.json` (via npm install)
- Create: `lib/gsap.ts`

- [ ] **Step 1: Install packages**

```bash
npm install gsap @gsap/react
```

Expected output includes `gsap` and `@gsap/react` in node_modules.

- [ ] **Step 2: Create GSAP barrel — registers ScrollTrigger once**

Create `lib/gsap.ts`:

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
export { useGSAP } from "@gsap/react";
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add lib/gsap.ts package.json package-lock.json
git commit -m "feat(landing): install GSAP + @gsap/react, create shared barrel"
```

---

## Task 1: CSS foundation — scroll animations + texture classes + enhanced countdown glow

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the `/* Hero Countdown */` block at the end of globals.css (from line 262 to EOF) with the following**

```css
/* ── Partners carousel ────────────────────────────────────────────────────── */
@keyframes scroll-left {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes scroll-right {
  from { transform: translateX(-50%); }
  to   { transform: translateX(0); }
}
.animate-scroll-left  { animation: scroll-left  30s linear infinite; }
.animate-scroll-right { animation: scroll-right 35s linear infinite; }

/* Pause on hover of the outer track container */
.partners-track:hover .animate-scroll-left,
.partners-track:hover .animate-scroll-right {
  animation-play-state: paused;
}

/* Hero Countdown */
.countdown-num {
  font-size: clamp(64px, 11vw, 130px);
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.03em;
  text-shadow:
    0 0 60px rgba(245, 196, 0, 0.30),
    0 0 120px rgba(245, 196, 0, 0.10),
    0 4px 40px rgba(0, 0, 0, 0.4);
  font-variant-numeric: tabular-nums;
}
.countdown-dot {
  font-size: clamp(36px, 6vw, 78px);
  font-weight: 900;
  color: #f5c400;
  opacity: 0.7;
  margin: 0 4px;
  align-self: center;
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style(landing): partner carousel keyframes + enhanced countdown glow"
```

---

## Task 2: Create shared texture components

**Files:**
- Create: `components/landing/LandingTextures.tsx`

- [ ] **Step 1: Create the file**

```tsx
const GridTexture = ({ opacity = 0.04 }: { opacity?: number }) => (
  <div
    className="pointer-events-none absolute inset-0"
    style={{
      backgroundImage:
        "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
      backgroundSize: "28px 28px",
      opacity,
    }}
  />
);

const PlusTexture = ({ opacity = 0.025 }: { opacity?: number }) => (
  <div
    className="pointer-events-none absolute inset-0"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 0h2v40h-2zM0 19h40v2H0z' fill='rgba(255%2C255%2C255%2C1)'/%3E%3C/svg%3E")`,
      opacity,
    }}
  />
);

interface GoldRadialGlowProps {
  from?: "top" | "center" | "bottom";
  intensity?: number;
}

const GoldRadialGlow = ({ from = "top", intensity = 0.07 }: GoldRadialGlowProps) => {
  const pos = from === "top" ? "50% 0%" : from === "bottom" ? "50% 100%" : "50% 50%";
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(ellipse 900px 600px at ${pos}, rgba(245,196,0,${intensity}) 0%, transparent 70%)`,
      }}
    />
  );
};

export { GridTexture, PlusTexture, GoldRadialGlow };
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/LandingTextures.tsx
git commit -m "feat(landing): shared texture overlay components"
```

---

## Task 3: Header redesign

**Files:**
- Modify: `components/landing/HeaderClient.tsx`

Note: Keep `motion/react` in this file for the mobile drawer spring animation and nav `layoutId` underline. Only visual style changes here — no GSAP needed.

- [ ] **Step 1: Update header element classes (line 48)**

```tsx
// OLD
<header className="fixed top-0 z-50 w-full border-b border-white/12 bg-[#040D1C]">
```
```tsx
// NEW
<header className="fixed top-0 z-50 w-full border-b border-[#F5C400]/10 bg-[#0A0A0A]/88 backdrop-blur-md">
```

- [ ] **Step 2: Update mobile overlay bg (line 139)**

```tsx
// OLD
className="fixed inset-0 z-40 bg-[#040D1C]/80 md:hidden"
```
```tsx
// NEW
className="fixed inset-0 z-40 bg-[#0A0A0A]/80 md:hidden"
```

- [ ] **Step 3: Update mobile drawer bg (line 153)**

```tsx
// OLD
className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-white/12 bg-[#040D1C] md:hidden"
```
```tsx
// NEW
className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-[#F5C400]/10 bg-[#0A0A0A] md:hidden"
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add components/landing/HeaderClient.tsx
git commit -m "style(landing): header backdrop-blur + gold border"
```

---

## Task 4: HeroSection redesign — GSAP crossfade replaces AnimatePresence

**Files:**
- Modify: `components/landing/HeroSection.tsx`

(HeroCountdown.tsx unchanged — countdown glow handled by CSS in Task 1.)

- [ ] **Step 1: Rewrite HeroSection.tsx entirely**

```tsx
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
            ref={(el) => { bgRefs.current[i] = el; }}
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
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/HeroSection.tsx
git commit -m "style(landing): hero GSAP crossfade + textures + glass countdown panel"
```

---

## Task 5: UpcomingMatchesSection — GSAP stagger replaces motion.div

**Files:**
- Modify: `components/landing/UpcomingMatchesSection.tsx`

- [ ] **Step 1: Rewrite entire file**

```tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { PublicTournament } from "@/features/admin/queries";
import { GridTexture, PlusTexture } from "@/components/landing/LandingTextures";

interface Props {
  tournaments: PublicTournament[];
}

function formatCardDate(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr + "T00:00:00");
  const d = date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return timeStr ? `${d} · ${timeStr.slice(0, 5)}` : d;
}

const UpcomingMatchesSection = ({ tournaments }: Props) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".um-header", {
      y: 16, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
    gsap.from(".um-card", {
      y: 16, opacity: 0, duration: 0.45, stagger: 0.1, ease: "power2.out",
      scrollTrigger: { trigger: ".um-card", start: "top 88%", once: true },
    });
  }, { scope: sectionRef });

  if (tournaments.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
      <GridTexture opacity={0.03} />
      <PlusTexture opacity={0.018} />
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="um-header mb-8 flex flex-wrap items-end justify-between gap-4 pb-8">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="h-4 w-0.5 bg-[#F5C400]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                Upcoming Schedule
              </p>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Upcoming Matches
            </h2>
          </div>
          <Link
            href="/schedule"
            className="text-[11px] font-bold uppercase tracking-widest text-[#F5C400]/60 transition hover:text-[#F5C400]"
          >
            View schedule →
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="um-card group flex flex-col gap-3 border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:border-[#F5C400]/30 hover:shadow-[0_0_24px_rgba(245,196,0,0.07)]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5C400]">
                  {formatCardDate(t.start_date, t.start_time)}
                </p>
                {t.game && (
                  <span className="shrink-0 border border-[#F5C400]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F5C400]/70">
                    {t.game}
                  </span>
                )}
              </div>
              <p className="font-black uppercase leading-tight tracking-tight text-white sm:text-lg">
                {t.name}
              </p>
              <div className="flex flex-col gap-0.5">
                {t.division_name && <p className="text-xs text-white/45">{t.division_name}</p>}
                {t.organizer && <p className="text-xs text-white/35">{t.organizer}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { UpcomingMatchesSection };
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/UpcomingMatchesSection.tsx
git commit -m "style(landing): upcoming matches GSAP stagger + glassmorphism cards"
```

---

## Task 6: DivisionsSection redesign

**Files:**
- Modify: `components/landing/DivisionsSection.tsx`

Note: Server Component — no GSAP (no client JS). Static glassmorphism + Tailwind hover.

- [ ] **Step 1: Rewrite entire file**

```tsx
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GridTexture, PlusTexture } from "@/components/landing/LandingTextures";

export async function DivisionsSection() {
  const admin = createAdminClient();

  const { data: divisions } = await admin
    .from("divisions")
    .select("id, name, slug, game, description, logo_url")
    .eq("is_public", true)
    .eq("is_active", true)
    .order("name")
    .limit(20);

  const items = divisions ?? [];
  if (items.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
      <GridTexture opacity={0.03} />
      <PlusTexture opacity={0.018} />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="h-4 w-0.5 bg-[#F5C400]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                  Our Teams
                </p>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                Divisions
              </h2>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((div) => (
            <Link
              key={div.id}
              href={`/divisions/${div.slug}`}
              className="group flex flex-col gap-3 border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:border-[#F5C400]/30 hover:shadow-[0_0_20px_rgba(245,196,0,0.06)] sm:p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden border border-white/[0.08] bg-white/[0.04]">
                  {div.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={div.logo_url} alt={div.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs font-black uppercase text-white/40">
                      {div.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm text-white/25 transition-colors group-hover:text-[#F5C400]">→</span>
              </div>
              <div>
                <p className="font-black uppercase leading-tight tracking-tight text-white sm:text-sm">
                  {div.name}
                </p>
                {div.game && (
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/45">{div.game}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/DivisionsSection.tsx
git commit -m "style(landing): divisions glassmorphism cards + texture overlay"
```

---

## Task 7: AchievementsSection — GSAP stagger + gold glow placement

**Files:**
- Modify: `components/landing/AchievementsSection.tsx`

Note: Keep `motion/react` only for the lightbox `AnimatePresence`. Everything else migrates to GSAP.

- [ ] **Step 1: Rewrite entire file**

```tsx
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
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/AchievementsSection.tsx
git commit -m "style(landing): achievements GSAP stagger + gold glow #1 + textures"
```

---

## Task 8: LatestNewsSection — GSAP stagger + image-overlay cards

**Files:**
- Modify: `components/landing/LatestNewsSection.tsx`

- [ ] **Step 1: Rewrite entire file**

```tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { Newspaper } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { NewsPost } from "@/features/admin/queries";
import { GridTexture, PlusTexture } from "@/components/landing/LandingTextures";

interface Props {
  posts: NewsPost[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const LatestNewsSection = ({ posts }: Props) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".news-header", {
      y: 16, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
    gsap.from(".news-card", {
      y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out",
      scrollTrigger: { trigger: ".news-card", start: "top 88%", once: true },
    });
  }, { scope: sectionRef });

  if (posts.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
      <GridTexture opacity={0.03} />
      <PlusTexture opacity={0.018} />
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="news-header mb-8 flex flex-wrap items-end justify-between gap-4 pb-8">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="h-4 w-0.5 bg-[#F5C400]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                News &amp; Updates
              </p>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Latest News
            </h2>
          </div>
          <Link
            href="/news"
            className="text-[11px] font-bold uppercase tracking-widest text-[#F5C400]/60 transition hover:text-[#F5C400]"
          >
            Lihat semua →
          </Link>
        </div>

        {/* Cards — image-bg overlay (gamingonavax style) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div key={post.id} className="news-card">
              <Link
                href={`/news/${post.slug}`}
                className="group relative flex h-64 overflow-hidden border border-white/[0.08] transition-all duration-300 hover:border-[#F5C400]/30"
              >
                {post.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.cover_image_url}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: "brightness(0.55) saturate(0.7)" }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/[0.03]">
                    <Newspaper className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(245,196,0,0.06) 0%, transparent 70%)" }}
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
                  <span className="w-fit border border-[#F5C400]/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F5C400]/80">
                    {formatDate(post.published_at)}
                  </span>
                  <p className="font-black uppercase leading-tight tracking-tight text-white transition-colors duration-200 group-hover:text-[#F5C400]">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/50">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { LatestNewsSection };
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/LatestNewsSection.tsx
git commit -m "style(landing): news GSAP stagger + image-bg overlay cards"
```

---

## Task 9: TestimonialsSection — GSAP stagger + blurred-bg vertical cards

**Files:**
- Modify: `components/landing/TestimonialsSection.tsx`

- [ ] **Step 1: Rewrite entire file**

```tsx
"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Testimonial } from "@/features/admin/queries";
import { GridTexture } from "@/components/landing/LandingTextures";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const TestimonialCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(cardRef.current, {
      y: 24,
      opacity: 0,
      duration: 0.6,
      delay: index * 0.08,
      ease: "power2.out",
      scrollTrigger: { trigger: cardRef.current, start: "top 88%", once: true },
    });
  }, { scope: cardRef });

  return (
    <div
      ref={cardRef}
      className="group relative min-h-[300px] overflow-hidden border border-white/[0.07] transition-all duration-300 hover:border-[#F5C400]/20"
    >
      {testimonial.avatar_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={testimonial.avatar_url}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-110 object-cover"
          style={{ filter: "blur(10px) brightness(0.22) saturate(0.4)" }}
        />
      )}
      <div className="absolute inset-0 bg-black/75" />
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(245,196,0,0.05) 0%, transparent 70%)" }}
      />
      <div className="relative z-10 flex min-h-[300px] flex-col justify-between p-8 sm:p-10">
        <div>
          <p className="mb-5 text-5xl font-black leading-none text-[#F5C400]" aria-hidden="true">&ldquo;</p>
          <p className="max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {testimonial.content}
          </p>
        </div>
        <div className="mt-8 flex items-center gap-4 border-t border-white/[0.08] pt-6">
          {testimonial.avatar_url && (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#F5C400]/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={testimonial.avatar_url} alt={testimonial.author_name} loading="lazy" className="h-full w-full object-cover" />
            </div>
          )}
          <div>
            <p className="font-black uppercase tracking-tight text-white">{testimonial.author_name}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5C400]/60">
              {testimonial.author_role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".testi-header", {
      y: 16, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
  }, { scope: sectionRef });

  if (testimonials.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
      <GridTexture opacity={0.03} />
      <div className="relative mx-auto max-w-7xl">
        <div className="testi-header mb-10 pb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-4 w-0.5 bg-[#F5C400]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">Alumni</p>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            Testimonials
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.id} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
export { TestimonialsSection };
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/TestimonialsSection.tsx
git commit -m "style(landing): testimonials GSAP stagger + blurred-bg vertical cards"
```

---

## Task 10: PartnersSection — GSAP entrance + dual CSS infinite scroll

**Files:**
- Modify: `components/landing/PartnersSection.tsx`

- [ ] **Step 1: Rewrite entire file**

```tsx
"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Partner } from "@/features/admin/queries";
import { GridTexture } from "@/components/landing/LandingTextures";

interface PartnersSectionProps {
  partners: Partner[];
}

const PartnersSection = ({ partners }: PartnersSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".partners-header", {
      y: 16, opacity: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
    });
    gsap.from(".partners-track", {
      opacity: 0, duration: 0.7, delay: 0.2, ease: "power1.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
    });
  }, { scope: sectionRef });

  if (partners.length === 0) return null;

  const row1 = [...partners, ...partners];
  const row2 = [...partners].reverse().concat([...partners].reverse());

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0A0A0A] py-20">
      <GridTexture opacity={0.025} />
      <div className="relative">
        <div className="partners-header mb-10 px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-4 w-0.5 bg-[#F5C400]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                Partners &amp; Sponsors
              </p>
            </div>
          </div>
        </div>
        <div className="partners-track flex flex-col gap-8">
          {/* Row 1: scroll left */}
          <div className="overflow-hidden">
            <div className="flex animate-scroll-left items-center gap-16 whitespace-nowrap">
              {row1.map((p, i) => (
                <div key={`r1-${p.id}-${i}`} className="inline-flex shrink-0 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo_url ?? ""}
                    alt={p.name}
                    loading="lazy"
                    className="h-9 w-auto max-w-[140px] object-contain grayscale opacity-25 transition-all duration-500 hover:opacity-75 hover:grayscale-0"
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Row 2: scroll right */}
          <div className="overflow-hidden">
            <div className="flex animate-scroll-right items-center gap-16 whitespace-nowrap">
              {row2.map((p, i) => (
                <div key={`r2-${p.id}-${i}`} className="inline-flex shrink-0 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.logo_url ?? ""}
                    alt={p.name}
                    loading="lazy"
                    className="h-9 w-auto max-w-[140px] object-contain grayscale opacity-25 transition-all duration-500 hover:opacity-75 hover:grayscale-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export { PartnersSection };
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/PartnersSection.tsx
git commit -m "style(landing): partners GSAP fade-in + dual CSS infinite scroll"
```

---

## Task 11: JoinUsSection — GSAP entrance + heavy texture

**Files:**
- Modify: `components/landing/JoinUsSection.tsx`

- [ ] **Step 1: Rewrite entire file**

```tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { JoinModal } from "./JoinModal";
import { GridTexture, PlusTexture, GoldRadialGlow } from "@/components/landing/LandingTextures";

interface JoinSettings {
  join_eyebrow: string;
  join_title_line1: string;
  join_title_line2: string;
  join_description: string;
  join_fine_print: string;
}

interface JoinUsSectionProps {
  settings: JoinSettings;
}

const JoinUsSection = ({ settings }: JoinUsSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".join-left", {
      y: 20, opacity: 0, duration: 0.55, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
    });
    gsap.from(".join-right", {
      y: 20, opacity: 0, duration: 0.55, delay: 0.12, ease: "power2.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0A0A0A] px-5 py-24 sm:px-8 lg:px-10">
      <GridTexture opacity={0.04} />
      <PlusTexture opacity={0.025} />
      <GoldRadialGlow from="center" intensity={0.07} />
      <div className="relative mx-auto max-w-7xl">
        <div className="border-b border-t border-[#F5C400]/15 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="join-left">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-4 w-0.5 bg-[#F5C400]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                  {settings.join_eyebrow}
                </p>
              </div>
              <h2 className="text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                {settings.join_title_line1}
                <br />
                <span
                  className="text-[#F5C400]"
                  style={{ textShadow: "0 0 40px rgba(245,196,0,0.25)" }}
                >
                  {settings.join_title_line2}
                </span>
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/55 sm:text-[15px]">
                {settings.join_description}
              </p>
            </div>
            <div className="join-right flex flex-col items-start gap-3 lg:items-end">
              <JoinModal />
              <Link
                href="/divisions"
                className="inline-flex h-10 items-center border border-white/20 px-6 text-[11px] font-bold uppercase tracking-widest text-white/50 transition duration-200 hover:border-white/40 hover:text-white"
              >
                Lihat Divisi
              </Link>
              <p className="text-xs text-white/22">{settings.join_fine_print}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export { JoinUsSection };
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/JoinUsSection.tsx
git commit -m "style(landing): join section GSAP + heavy texture + gold glow + second CTA"
```

---

## Task 12: Footer redesign

**Files:**
- Modify: `components/landing/Footer.tsx`

- [ ] **Step 1: Add GridTexture import**

```tsx
import { GridTexture } from "@/components/landing/LandingTextures";
```

- [ ] **Step 2: Update footer bg + border + add texture + relative wrapper**

```tsx
// OLD
<footer className="border-t border-white/12 bg-[#040D1C] px-5 pb-10 pt-16 sm:px-8 lg:px-10">
  <div className="mx-auto max-w-7xl">
```
```tsx
// NEW
<footer className="relative overflow-hidden border-t border-[#F5C400]/10 bg-[#0A0A0A] px-5 pb-10 pt-16 sm:px-8 lg:px-10">
  <GridTexture opacity={0.025} />
  <div className="relative mx-auto max-w-7xl">
```

- [ ] **Step 3: Update bottom bar border + hashtag glow**

```tsx
// OLD
<div className="mt-14 flex flex-col gap-2 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
  ...
  <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5C400]/50">
    {settings.footer_hashtag}
  </p>
```
```tsx
// NEW
<div className="mt-14 flex flex-col gap-2 border-t border-[#F5C400]/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
  ...
  <p
    className="text-[10px] font-bold uppercase tracking-widest text-[#F5C400]/70"
    style={{ textShadow: "0 0 12px rgba(245,196,0,0.35)" }}
  >
    {settings.footer_hashtag}
  </p>
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add components/landing/Footer.tsx
git commit -m "style(landing): footer dark bg + grid texture + gold border + glow hashtag"
```

---

## Task 13: Final CI gate + visual verification

- [ ] **Step 1: Run full CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit:coverage
```
Expected: all three exit 0. If lint fails with unused-import errors from old motion/react imports, remove the unused imports.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Open `http://localhost:3000` and verify each section:

| Section | Check |
|---------|-------|
| Header | Glass blur visible when scrolling; gold bottom border |
| Hero | Grid dots + gold glow visible; countdown inside glass panel |
| Upcoming Matches | Glass cards; gold border on hover; cards animate in on scroll |
| Divisions | Glass cards; gold border on hover |
| Achievements | Dark bg; gold glow on `#1` placement label |
| News | Image fills card; text overlaid bottom; date chip visible |
| Testimonials | Blurred bg image per card; author row bottom; stagger animate |
| Partners | Two logo rows scrolling opposite directions; pause on hover |
| Join Us | Grid dots + plus texture visible; gold title glow; two CTA buttons |
| Footer | Darker bg; gold hashtag glow; gold top border |

- [ ] **Step 3: Push**

```bash
git push
```
