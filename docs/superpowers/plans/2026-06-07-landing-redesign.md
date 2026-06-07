# Landing Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully redesign all landing page components to match the gamingonavax.com visual language — dark near-black bg, glassmorphism cards, texture overlays (grid + plus + gold glow), gold #F5C400 neon accent — replacing the current flat navy-blue aesthetic.

**Architecture:** Each landing component is rewritten in-place (same props/exports, same data-fetching). No changes to `app/page.tsx`, server actions, or queries. One new shared file (`LandingTextures.tsx`) provides the three reusable texture overlays. CSS keyframes for partner carousel go in `globals.css`.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, motion/react (framer-motion), Lucide React, Supabase admin client (DivisionsSection only)

---

## Task 1: CSS foundation — scroll animations + texture classes + enhanced countdown glow

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Open globals.css and locate the "Landing page animations" section (line ~232). Replace the existing `.countdown-num` block and add new keyframes after it.**

Replace from line 262 (`/* Hero Countdown */`) to end of file with:

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

- [ ] **Step 2: Verify globals.css has no syntax errors**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: exit 0 (or only pre-existing errors unrelated to globals.css).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style(landing): add partner carousel keyframes + enhanced countdown glow"
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

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/landing/LandingTextures.tsx
git commit -m "feat(landing): add shared texture overlay components"
```

---

## Task 3: Header redesign

**Files:**
- Modify: `components/landing/HeaderClient.tsx`

- [ ] **Step 1: Update header element classes**

In `HeaderClient.tsx` at line 48, change:
```tsx
// OLD
<header className="fixed top-0 z-50 w-full border-b border-white/12 bg-[#040D1C]">
```
To:
```tsx
// NEW
<header className="fixed top-0 z-50 w-full border-b border-[#F5C400]/10 bg-[#0A0A0A]/88 backdrop-blur-md">
```

- [ ] **Step 2: Update mobile overlay bg**

At line 139 (mobile backdrop overlay):
```tsx
// OLD
className="fixed inset-0 z-40 bg-[#040D1C]/80 md:hidden"
```
```tsx
// NEW
className="fixed inset-0 z-40 bg-[#0A0A0A]/80 md:hidden"
```

- [ ] **Step 3: Update mobile drawer bg**

At line 153 (mobile drawer panel):
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

## Task 4: HeroSection redesign

**Files:**
- Modify: `components/landing/HeroSection.tsx`

(HeroCountdown.tsx needs no changes — countdown glow is handled via `.countdown-num` CSS updated in Task 1.)

- [ ] **Step 1: Add texture imports to HeroSection.tsx**

At the top of `HeroSection.tsx`, add to imports:
```tsx
import { GridTexture, PlusTexture, GoldRadialGlow } from "@/components/landing/LandingTextures";
```

- [ ] **Step 2: Change section background color**

At line 57 in HeroSection.tsx:
```tsx
// OLD
<section className="relative flex min-h-screen flex-col overflow-hidden bg-[#040D1C]">
```
```tsx
// NEW
<section className="relative flex min-h-screen flex-col overflow-hidden bg-[#0A0A0A]">
```

- [ ] **Step 3: Add texture overlays right after the section opening tag, before the background image div**

After the `<section ...>` opening tag and before the `{/* Background */}` comment block, insert:
```tsx
{/* Texture overlays */}
<GridTexture opacity={0.035} />
<PlusTexture opacity={0.02} />
<GoldRadialGlow from="top" intensity={0.06} />
```

- [ ] **Step 4: Wrap the HeroCountdown in a glassmorphism panel**

In HeroSection.tsx, find the countdown wrapper (around line 104):
```tsx
// OLD
<div className="flex flex-1 items-center justify-center px-5 sm:px-8 lg:px-10">
  <HeroCountdown tournaments={featuredTournaments} />
</div>
```
```tsx
// NEW
<div className="flex flex-1 items-center justify-center px-5 sm:px-8 lg:px-10">
  <div className="w-full max-w-3xl rounded-sm border border-[#F5C400]/15 bg-white/[0.03] px-8 py-10 backdrop-blur-sm sm:px-12 sm:py-14">
    <HeroCountdown tournaments={featuredTournaments} />
  </div>
</div>
```

- [ ] **Step 5: Update non-tournament wordmark section background context**

In the wordmark CTA button (around line 132), update the border hover style for gold glow:
```tsx
// OLD
className="inline-flex h-10 items-center border border-[#F5C400] px-6 text-[11px] font-black uppercase tracking-widest text-[#F5C400] transition duration-200 hover:bg-[#F5C400] hover:text-black"
```
```tsx
// NEW
className="inline-flex h-10 items-center border border-[#F5C400] px-6 text-[11px] font-black uppercase tracking-widest text-[#F5C400] shadow-[0_0_20px_rgba(245,196,0,0)] transition duration-200 hover:bg-[#F5C400] hover:text-black hover:shadow-[0_0_20px_rgba(245,196,0,0.25)]"
```

- [ ] **Step 6: Update bottom info bar border**

At line 149 (bottom bar):
```tsx
// OLD
<div className="relative z-10 border-t border-white/8">
```
```tsx
// NEW
<div className="relative z-10 border-t border-[#F5C400]/8">
```

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 8: Commit**

```bash
git add components/landing/HeroSection.tsx components/landing/HeroCountdown.tsx
git commit -m "style(landing): hero textures + glass countdown panel + gold glow CTA"
```

---

## Task 5: UpcomingMatchesSection redesign

**Files:**
- Modify: `components/landing/UpcomingMatchesSection.tsx`

- [ ] **Step 1: Add imports**

Add to existing imports at top:
```tsx
import { GridTexture, PlusTexture } from "@/components/landing/LandingTextures";
```

- [ ] **Step 2: Rewrite the full component**

Replace entire file content with:

```tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  if (tournaments.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
      <GridTexture opacity={0.03} />
      <PlusTexture opacity={0.018} />
      <div className="relative mx-auto max-w-7xl" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-wrap items-end justify-between gap-4 pb-8"
        >
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
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tournaments.map((t, index) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
              className="group flex flex-col gap-3 border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:border-[#F5C400]/30 hover:shadow-[0_0_24px_rgba(245,196,0,0.07)]"
            >
              {/* Date + game badge */}
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

              {/* Name */}
              <p className="font-black uppercase leading-tight tracking-tight text-white sm:text-lg">
                {t.name}
              </p>

              {/* Division + organizer */}
              <div className="flex flex-col gap-0.5">
                {t.division_name && (
                  <p className="text-xs text-white/45">{t.division_name}</p>
                )}
                {t.organizer && (
                  <p className="text-xs text-white/35">{t.organizer}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { UpcomingMatchesSection };
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/UpcomingMatchesSection.tsx
git commit -m "style(landing): upcoming matches glassmorphism cards + texture overlay"
```

---

## Task 6: DivisionsSection redesign

**Files:**
- Modify: `components/landing/DivisionsSection.tsx`

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

## Task 7: AchievementsSection redesign

**Files:**
- Modify: `components/landing/AchievementsSection.tsx`

- [ ] **Step 1: Add LandingTextures import at top of file**

```tsx
import { GridTexture, GoldRadialGlow } from "@/components/landing/LandingTextures";
```

- [ ] **Step 2: Update section bg + add textures**

Find the `<section id="achievements" ...>` element and update:
```tsx
// OLD
<section id="achievements" className="scroll-mt-14 bg-[#040D1C] px-5 py-20 sm:px-8 lg:px-10">
```
```tsx
// NEW
<section id="achievements" className="relative scroll-mt-14 overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
```

Right after the section opening tag, add:
```tsx
<GridTexture opacity={0.03} />
<GoldRadialGlow from="center" intensity={0.04} />
```

Wrap the `<div className="mx-auto max-w-7xl">` with `relative`:
```tsx
// OLD
<div className="mx-auto max-w-7xl">
```
```tsx
// NEW
<div className="relative mx-auto max-w-7xl">
```

- [ ] **Step 3: Update section label to use gold line style**

Find the eyebrow p tag in the header:
```tsx
// OLD
<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
  01 — Trophy Room
</p>
```
```tsx
// NEW
<div className="mb-2 flex items-center gap-3">
  <div className="h-4 w-0.5 bg-[#F5C400]" />
  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
    Trophy Room
  </p>
</div>
```

- [ ] **Step 4: Update AchievementRow hover bg + gold glow for placement #1**

In `AchievementRow`, find the `group relative overflow-hidden border-b...` div and update:
```tsx
// OLD
className={`group relative overflow-hidden border-b border-white/12 transition-colors${isClickable ? " hover:bg-white/[0.04]" : ""}`}
```
```tsx
// NEW
className={`group relative overflow-hidden border-b border-white/[0.06] transition-colors${isClickable ? " hover:bg-white/[0.03]" : ""}`}
```

In `AchievementRow`, find the placement label span and update for `#1` glow:
```tsx
// OLD
<span className="text-[11px] font-black uppercase tracking-widest text-[#F5C400]">
  {PLACEMENT_LABEL[item.placement] ?? `Juara ${item.placement}`}
</span>
```
```tsx
// NEW
<span
  className="text-[11px] font-black uppercase tracking-widest text-[#F5C400]"
  style={item.placement === 1 ? { textShadow: "0 0 16px rgba(245,196,0,0.6)" } : undefined}
>
  {PLACEMENT_LABEL[item.placement] ?? `Juara ${item.placement}`}
</span>
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add components/landing/AchievementsSection.tsx
git commit -m "style(landing): achievements dark bg + textures + gold glow placement"
```

---

## Task 8: LatestNewsSection redesign

**Files:**
- Modify: `components/landing/LatestNewsSection.tsx`

- [ ] **Step 1: Rewrite entire file with gamingonavax-style image-bg cards**

```tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { Newspaper } from "lucide-react";
import { motion, useInView } from "motion/react";
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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  if (posts.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
      <GridTexture opacity={0.03} />
      <PlusTexture opacity={0.018} />
      <div className="relative mx-auto max-w-7xl" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-wrap items-end justify-between gap-4 pb-8"
        >
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
        </motion.div>

        {/* Cards — gamingonavax image-bg overlay style */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
            >
              <Link
                href={`/news/${post.slug}`}
                className="group relative flex h-64 overflow-hidden border border-white/[0.08] transition-all duration-300 hover:border-[#F5C400]/30"
              >
                {/* Background image */}
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

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

                {/* Gold glow on hover */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(245,196,0,0.06) 0%, transparent 70%)" }}
                />

                {/* Content — absolute bottom */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
                  {/* Date chip */}
                  <span className="w-fit border border-[#F5C400]/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F5C400]/80">
                    {formatDate(post.published_at)}
                  </span>
                  <p className="font-black uppercase leading-tight tracking-tight text-white transition-colors duration-200 group-hover:text-[#F5C400]">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/50">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
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
git commit -m "style(landing): news cards image-bg overlay treatment (gamingonavax style)"
```

---

## Task 9: TestimonialsSection full rewrite

**Files:**
- Modify: `components/landing/TestimonialsSection.tsx`

- [ ] **Step 1: Rewrite entire file — vertical stacked blurred-bg cards**

```tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import type { Testimonial } from "@/features/admin/queries";
import { GridTexture } from "@/components/landing/LandingTextures";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const TestimonialCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" }}
      className="group relative min-h-[300px] overflow-hidden border border-white/[0.07] transition-all duration-300 hover:border-[#F5C400]/20"
    >
      {/* Background image — blurred, darkened */}
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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Gold glow — subtle, bottom */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(245,196,0,0.05) 0%, transparent 70%)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-[300px] flex-col justify-between p-8 sm:p-10">
        {/* Quote */}
        <div>
          <p className="mb-5 text-5xl font-black leading-none text-[#F5C400]" aria-hidden="true">&ldquo;</p>
          <p className="max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {testimonial.content}
          </p>
        </div>

        {/* Author row */}
        <div className="mt-8 flex items-center gap-4 border-t border-white/[0.08] pt-6">
          {testimonial.avatar_url && (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#F5C400]/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={testimonial.avatar_url}
                alt={testimonial.author_name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
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
    </motion.div>
  );
};

const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });

  if (testimonials.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] px-5 py-20 sm:px-8 lg:px-10">
      <GridTexture opacity={0.03} />
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 16 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 pb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-4 w-0.5 bg-[#F5C400]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">Alumni</p>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            Testimonials
          </h2>
        </motion.div>

        {/* Vertical stacked cards */}
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
git commit -m "style(landing): testimonials rewrite to blurred-bg card stack (gamingonavax)"
```

---

## Task 10: PartnersSection — dual infinite scroll carousel

**Files:**
- Modify: `components/landing/PartnersSection.tsx`

- [ ] **Step 1: Rewrite entire file**

```tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import type { Partner } from "@/features/admin/queries";
import { GridTexture } from "@/components/landing/LandingTextures";

interface PartnersSectionProps {
  partners: Partner[];
}

const PartnersSection = ({ partners }: PartnersSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  if (partners.length === 0) return null;

  // Duplicate array for seamless infinite loop
  const row1 = [...partners, ...partners];
  const row2 = [...partners].reverse().concat([...partners].reverse());

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] py-20">
      <GridTexture opacity={0.025} />
      <div className="relative" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 px-5 sm:px-8 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-4 w-0.5 bg-[#F5C400]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                Partners &amp; Sponsors
              </p>
            </div>
          </div>
        </motion.div>

        {/* Dual-row infinite carousel — gamingonavax style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="partners-track flex flex-col gap-8"
        >
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
        </motion.div>
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
git commit -m "style(landing): partners dual infinite scroll carousel (gamingonavax)"
```

---

## Task 11: JoinUsSection redesign

**Files:**
- Modify: `components/landing/JoinUsSection.tsx`

- [ ] **Step 1: Add imports**

```tsx
import Link from "next/link";
import { GridTexture, PlusTexture, GoldRadialGlow } from "@/components/landing/LandingTextures";
```

(Add `Link` and texture imports at top. `Link` is already available in Next.js.)

- [ ] **Step 2: Rewrite entire file**

```tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] px-5 py-24 sm:px-8 lg:px-10">
      <GridTexture opacity={0.04} />
      <PlusTexture opacity={0.025} />
      <GoldRadialGlow from="center" intensity={0.07} />
      <div className="relative mx-auto max-w-7xl" ref={ref}>
        <div className="border-b border-t border-[#F5C400]/15 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            {/* Left: headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55 }}
            >
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
            </motion.div>

            {/* Right: CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="flex flex-col items-start gap-3 lg:items-end"
            >
              <JoinModal />
              <Link
                href="/divisions"
                className="inline-flex h-10 items-center border border-white/20 px-6 text-[11px] font-bold uppercase tracking-widest text-white/50 transition duration-200 hover:border-white/40 hover:text-white"
              >
                Lihat Divisi
              </Link>
              <p className="text-xs text-white/22">{settings.join_fine_print}</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
export { JoinUsSection };
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/JoinUsSection.tsx
git commit -m "style(landing): join section heavy texture + gold glow + second CTA"
```

---

## Task 12: Footer redesign

**Files:**
- Modify: `components/landing/Footer.tsx`

- [ ] **Step 1: Add texture import**

```tsx
import { GridTexture } from "@/components/landing/LandingTextures";
```

- [ ] **Step 2: Update footer bg, border, and add texture**

```tsx
// OLD
<footer className="border-t border-white/12 bg-[#040D1C] px-5 pb-10 pt-16 sm:px-8 lg:px-10">
```
```tsx
// NEW
<footer className="relative overflow-hidden border-t border-[#F5C400]/10 bg-[#0A0A0A] px-5 pb-10 pt-16 sm:px-8 lg:px-10">
```

Right after the footer opening tag, add:
```tsx
<GridTexture opacity={0.025} />
```

Wrap the inner `<div className="mx-auto max-w-7xl">` with `relative`:
```tsx
// OLD
<div className="mx-auto max-w-7xl">
```
```tsx
// NEW
<div className="relative mx-auto max-w-7xl">
```

- [ ] **Step 3: Add gold glow to hashtag**

Find the hashtag p element at bottom bar:
```tsx
// OLD
<p className="text-[10px] font-bold uppercase tracking-widest text-[#F5C400]/50">
  {settings.footer_hashtag}
</p>
```
```tsx
// NEW
<p
  className="text-[10px] font-bold uppercase tracking-widest text-[#F5C400]/70"
  style={{ textShadow: "0 0 12px rgba(245,196,0,0.35)" }}
>
  {settings.footer_hashtag}
</p>
```

- [ ] **Step 4: Update bottom bar top border**

```tsx
// OLD
<div className="mt-14 flex flex-col gap-2 border-t border-white/12 pt-6 ...">
```
```tsx
// NEW
<div className="mt-14 flex flex-col gap-2 border-t border-[#F5C400]/8 pt-6 ...">
```

- [ ] **Step 5: Typecheck + unit tests**

```bash
npm run typecheck 2>&1 | tail -5
npm run test:unit:coverage 2>&1 | tail -10
```
Expected: both exit 0.

- [ ] **Step 6: Lint**

```bash
npm run lint 2>&1 | grep -E "^E|error" | head -20
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/landing/Footer.tsx
git commit -m "style(landing): footer dark bg + texture + gold border + glow hashtag"
```

---

## Task 13: Final verification

- [ ] **Step 1: Run full CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit:coverage
```
Expected: all three exit 0.

- [ ] **Step 2: Start dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- All 10 sections render without visual errors
- Header: glass blur visible when scrolling over content
- Hero: texture dots and gold glow visible
- Upcoming Matches: glass cards with gold border on hover
- Divisions: glass cards with gold border on hover
- Achievements: dark bg, gold glow on #1 placement
- News: image fills card, text overlaid at bottom
- Testimonials: blurred bg image visible per card, author row at bottom
- Partners: two rows of logos scrolling in opposite directions, pause on hover
- Join Us: heavy texture visible, second "Lihat Divisi" button present
- Footer: darker bg, gold hashtag glow

- [ ] **Step 3: Push**

```bash
git push
```
