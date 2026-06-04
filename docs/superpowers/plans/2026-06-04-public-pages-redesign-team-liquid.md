# Public Pages Redesign — Team Liquid Aesthetic

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all public-facing pages from pure-black to deep-navy Team Liquid aesthetic — new color system, card grid for divisions, updated player profile — without touching workspace/dashboard.

**Architecture:** Pure visual swap — no DB queries, server actions, or auth logic changes. All changes are Tailwind class replacements plus one structural change (DivisionsSection/DivisionsGrid from list rows → card grid). Shared components (Header, Footer) updated first since they appear on every page.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, motion/react (framer), Lucide React. No new dependencies.

---

## Color Token Reference (use this throughout)

| Old | New |
|---|---|
| `bg-black`, `bg-[#070707]` | `bg-[#040D1C]` |
| `bg-[#0D0D0D]` | `bg-[#071428]` |
| `bg-[#1E1E1E]`, `bg-[#2E2E2E]`, `bg-[#2C2C2C]` | `bg-[#0C1E3C]` |
| `border-white/5`, `border-white/6`, `border-white/8` | `border-white/12` |
| `text-white/28`, `text-white/30`, `text-white/32`, `text-white/35` | `text-white/55` |
| `text-white/18`, `text-white/20`, `text-white/22`, `text-white/25` | `text-white/38` |

---

## Pre-Commit CI Gate

Before EVERY commit run these three and fix any failures before committing:
```bash
npm run lint
npm run typecheck
npm run test:unit
```

---

## Task 1: Header + Footer

**Files:**
- Modify: `components/landing/HeaderClient.tsx`
- Modify: `components/landing/Footer.tsx`

- [ ] **Step 1: Update HeaderClient background**

In `components/landing/HeaderClient.tsx`, line 48:
```tsx
// Before
<header className="fixed top-0 z-50 w-full border-b border-white/8 bg-black">

// After
<header className="fixed top-0 z-50 w-full border-b border-white/12 bg-[#040D1C]">
```

Line 153 (mobile drawer):
```tsx
// Before
className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-white/8 bg-black md:hidden"

// After
className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-white/12 bg-[#040D1C] md:hidden"
```

Line 155 (mobile drawer header):
```tsx
// Before
<div className="flex h-14 items-center justify-between border-b border-white/8 px-5">

// After
<div className="flex h-14 items-center justify-between border-b border-white/12 px-5">
```

Line 174 (mobile nav item):
```tsx
// Before
<li key={link.href} className="border-b border-white/6">

// After
<li key={link.href} className="border-b border-white/12">
```

Line 227 (mobile drawer footer):
```tsx
// Before
<div className="border-t border-white/8 px-5 py-4">

// After
<div className="border-t border-white/12 px-5 py-4">
```

Also update the mobile overlay backdrop (line ~139):
```tsx
// Before
className="fixed inset-0 z-40 bg-black/80 md:hidden"

// After
className="fixed inset-0 z-40 bg-[#040D1C]/80 md:hidden"
```

- [ ] **Step 2: Update Footer background and text colors**

In `components/landing/Footer.tsx`, line 38:
```tsx
// Before
<footer className="border-t border-white/8 bg-black px-5 pb-10 pt-16 sm:px-8 lg:px-10">

// After
<footer className="border-t border-white/12 bg-[#040D1C] px-5 pb-10 pt-16 sm:px-8 lg:px-10">
```

Line 55 (tagline text):
```tsx
// Before
<p className="mt-4 max-w-xs text-xs leading-relaxed text-white/28">

// After
<p className="mt-4 max-w-xs text-xs leading-relaxed text-white/45">
```

Line 63 (Instagram link):
```tsx
// Before
className="mt-5 inline-flex items-center gap-2 text-xs text-white/28 transition hover:text-white"

// After
className="mt-5 inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"
```

Line 76 (column titles):
```tsx
// Before
<h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/28">

// After
<h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/45">
```

Line 81 (link items):
```tsx
// Before
<Link href={l.href} className="text-xs text-white/30 transition hover:text-white">

// After
<Link href={l.href} className="text-xs text-white/45 transition hover:text-white">
```

Line 96 (bottom bar):
```tsx
// Before
<div className="mt-14 flex flex-col gap-2 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">

// After
<div className="mt-14 flex flex-col gap-2 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
```

Line 97 (copyright text):
```tsx
// Before
<p className="text-[10px] uppercase tracking-widest text-white/18">

// After
<p className="text-[10px] uppercase tracking-widest text-white/38">
```

Line 100 (hashtag):
```tsx
// Before
<p className="text-[10px] font-bold uppercase tracking-widest text-[#F5C400]/30">

// After
<p className="text-[10px] font-bold uppercase tracking-widest text-[#F5C400]/50">
```

- [ ] **Step 3: Run CI gate**
```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: all pass (zero new errors).

- [ ] **Step 4: Commit**
```bash
rtk git add components/landing/HeaderClient.tsx components/landing/Footer.tsx
rtk git commit -m "style(public): header + footer — black → deep navy palette"
```

---

## Task 2: Hero Section

**Files:**
- Modify: `components/landing/HeroSection.tsx`

- [ ] **Step 1: Update section background and gradient overlay**

In `components/landing/HeroSection.tsx`, line 57:
```tsx
// Before
<section className="relative flex min-h-screen flex-col overflow-hidden bg-black">

// After
<section className="relative flex min-h-screen flex-col overflow-hidden bg-[#040D1C]">
```

In the custom background overlay (line ~71), update the gradient to have a navy tint:
```tsx
// Before
<div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)" }} />

// After
<div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(4,13,28,0.35) 0%, rgba(4,13,28,0.6) 100%)" }} />
```

- [ ] **Step 2: Run CI gate**
```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: all pass.

- [ ] **Step 3: Commit**
```bash
rtk git add components/landing/HeroSection.tsx
rtk git commit -m "style(public): hero section — navy background + gradient overlay"
```

---

## Task 3: Divisions Section + Grid — Card Grid Redesign

This is the biggest structural change. Both `DivisionsSection.tsx` (home page server component) and `DivisionsGrid.tsx` (client component with animations + slug links) are converted from list rows to 4-column card grids.

**Files:**
- Modify: `components/landing/DivisionsSection.tsx`
- Modify: `components/landing/DivisionsGrid.tsx`

- [ ] **Step 1: Rewrite DivisionsSection to card grid**

Replace the entire content of `components/landing/DivisionsSection.tsx` with:

```tsx
import { createAdminClient } from "@/lib/supabase/admin";

export async function DivisionsSection() {
  const admin = createAdminClient();

  const { data: divisions } = await admin
    .from("divisions")
    .select("id, name, game, description, logo_url")
    .eq("is_public", true)
    .eq("is_active", true)
    .order("name")
    .limit(20);

  const items = divisions ?? [];
  if (items.length === 0) return null;

  return (
    <section className="bg-[#040D1C] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 border-b border-white/12 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
                02 — Our Teams
              </p>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                Divisions
              </h2>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((div) => (
            <div
              key={div.id}
              className="group flex flex-col gap-3 border border-white/10 bg-[#071428] p-5 transition-all duration-200 hover:border-[#F5C400]/50 hover:bg-[#0C1E3C] sm:p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-white/10 bg-white/5">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Rewrite DivisionsGrid to card grid**

Replace the entire content of `components/landing/DivisionsGrid.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";

const GAME_META: Record<string, { color: string; abbr: string }> = {
  "mobile legends": { color: "#F5C400", abbr: "MLBB" },
  mobile_legends: { color: "#F5C400", abbr: "MLBB" },
  pubg: { color: "#F97316", abbr: "PUBG" },
  "pubg mobile": { color: "#F97316", abbr: "PUBGM" },
  "free fire": { color: "#22C55E", abbr: "FF" },
};

function getMeta(game: string) {
  const key = game.toLowerCase();
  return GAME_META[key] ?? { color: "#9B9A97", abbr: game.slice(0, 4).toUpperCase() };
}

interface Division {
  id: string;
  name: string;
  slug: string;
  game: string | null;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
}

interface DivisionsGridProps {
  divisions: Division[];
}

const DivisionsGrid = ({ divisions }: DivisionsGridProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <>
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="mb-8 border-b border-white/12 pb-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
              02 — Our Teams
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Divisions
            </h2>
          </div>
          <Link
            href="/divisions"
            className="text-[11px] font-bold uppercase tracking-widest text-white/45 transition hover:text-white"
          >
            View All →
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {divisions.map((div, index) => {
          const meta = getMeta(div.game ?? "");
          return (
            <motion.div
              key={div.id}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: index * 0.07 + 0.1, ease: "easeOut" }}
            >
              <Link
                href={`/divisions/${div.slug}`}
                className="group flex flex-col gap-3 border border-white/10 bg-[#071428] p-5 transition-all duration-200 hover:border-[#F5C400]/50 hover:bg-[#0C1E3C] sm:p-6"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="text-2xl font-black uppercase leading-none tracking-tighter"
                    style={{ color: meta.color }}
                  >
                    {meta.abbr}
                  </span>
                  <span className="text-sm text-white/25 transition-colors group-hover:text-[#F5C400]">→</span>
                </div>
                <div>
                  <p className="font-black uppercase leading-tight tracking-tight text-white sm:text-sm">
                    {div.name}
                  </p>
                  {div.description && (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-white/45">
                      {div.description}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </>
  );
};
export { DivisionsGrid };
```

- [ ] **Step 3: Run CI gate**
```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: all pass.

- [ ] **Step 4: Commit**
```bash
rtk git add components/landing/DivisionsSection.tsx components/landing/DivisionsGrid.tsx
rtk git commit -m "style(public): divisions — list rows → Team Liquid card grid"
```

---

## Task 4: Remaining Landing Sections (Color Tokens Only)

**Files:**
- Modify: `components/landing/AchievementsSection.tsx`
- Modify: `components/landing/TestimonialsSection.tsx`
- Modify: `components/landing/PartnersSection.tsx`
- Modify: `components/landing/JoinUsSection.tsx`

- [ ] **Step 1: Update AchievementsSection**

In `components/landing/AchievementsSection.tsx`:

Line 91 (row hover):
```tsx
// Before
className={`group relative overflow-hidden border-b border-white/8 transition-colors${isClickable ? " hover:bg-white/[0.02]" : ""}`}

// After
className={`group relative overflow-hidden border-b border-white/12 transition-colors${isClickable ? " hover:bg-white/[0.04]" : ""}`}
```

Line 108 (counter):
```tsx
// Before
<span className="text-3xl font-black tabular-nums text-white/12 sm:text-4xl">

// After
<span className="text-3xl font-black tabular-nums text-white/18 sm:text-4xl">
```

Line 117 (description):
```tsx
// Before
<p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/32 sm:text-sm">

// After
<p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/55 sm:text-sm">
```

Line 130 (year):
```tsx
// Before
<span className="text-[10px] font-bold uppercase tracking-widest text-white/28">

// After
<span className="text-[10px] font-bold uppercase tracking-widest text-white/45">
```

Line 152 (section bg):
```tsx
// Before
<section id="achievements" className="scroll-mt-14 bg-black px-5 py-20 sm:px-8 lg:px-10">

// After
<section id="achievements" className="scroll-mt-14 bg-[#040D1C] px-5 py-20 sm:px-8 lg:px-10">
```

Line 159 (header separator):
```tsx
// Before
className="mb-0 border-b border-white/8 pb-8"

// After
className="mb-0 border-b border-white/12 pb-8"
```

Line 163 (section label):
```tsx
// Before
<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">

// After
<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
```

- [ ] **Step 2: Update TestimonialsSection**

In `components/landing/TestimonialsSection.tsx`:

Line 32 (section bg):
```tsx
// Before
<section ref={sectionRef} className="bg-black px-5 py-20 sm:px-8 lg:px-10">

// After
<section ref={sectionRef} className="bg-[#040D1C] px-5 py-20 sm:px-8 lg:px-10">
```

Line 42 (header separator):
```tsx
// Before
className="mb-0 border-b border-white/8 pb-8"

// After
className="mb-0 border-b border-white/12 pb-8"
```

Line 43 (section label):
```tsx
// Before
<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">

// After
<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
```

Line 57 (left col border):
```tsx
// Before
className="border-b border-white/8 py-10 lg:border-b-0 lg:border-r lg:py-14 lg:pr-16"

// After
className="border-b border-white/12 py-10 lg:border-b-0 lg:border-r lg:py-14 lg:pr-16"
```

Line 91 (large quote mark):
```tsx
// Before
<p className="mb-4 text-8xl font-black leading-none text-white/6 sm:text-9xl">

// After
<p className="mb-4 text-8xl font-black leading-none text-white/10 sm:text-9xl">
```

Line 103 (quote text):
```tsx
// Before
<p className="text-sm leading-relaxed text-white/55 sm:text-base">

// After  (already readable, just ensure)
<p className="text-sm leading-relaxed text-white/65 sm:text-base">
```

Lines 119–131 (nav buttons):
```tsx
// Before (prev button)
className="flex h-9 w-9 cursor-pointer items-center justify-center border border-white/12 text-white/35 transition hover:border-white/35 hover:text-white"
// After
className="flex h-9 w-9 cursor-pointer items-center justify-center border border-white/20 text-white/50 transition hover:border-white/50 hover:text-white"

// Before (next button) — same change
```

- [ ] **Step 3: Update PartnersSection**

In `components/landing/PartnersSection.tsx`:

Line 18 (section bg):
```tsx
// Before
<section className="bg-black px-5 py-20 sm:px-8 lg:px-10">

// After
<section className="bg-[#040D1C] px-5 py-20 sm:px-8 lg:px-10">
```

Line 27 (header row):
```tsx
// Before (the border-white/8 on the header motion.div)
className="mb-0 border-b border-white/8 pb-8"

// After
className="mb-0 border-b border-white/12 pb-8"
```

Line 28 (label text):
```tsx
// Before
<p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">

// After
<p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
```

Line 29 (horizontal rule):
```tsx
// Before
<div className="mb-0.5 h-px flex-1 bg-white/5" />

// After
<div className="mb-0.5 h-px flex-1 bg-white/12" />
```

For the grid border classes (lines ~43-47): replace all `border-white/6` with `border-white/12`.

- [ ] **Step 4: Update JoinUsSection**

In `components/landing/JoinUsSection.tsx`:

Line 24 (section bg):
```tsx
// Before
<section className="bg-black px-5 py-24 sm:px-8 lg:px-10">

// After
<section className="bg-[#040D1C] px-5 py-24 sm:px-8 lg:px-10">
```

Line 26 (border wrapper):
```tsx
// Before
<div className="border-b border-t border-white/8 py-20">

// After
<div className="border-b border-t border-white/12 py-20">
```

Line 34 (eyebrow):
```tsx
// Before
<p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">

// After
<p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-white/45">
```

Line 42 (description):
```tsx
// Before
<p className="mt-5 max-w-lg text-sm leading-relaxed text-white/35 sm:text-[15px]">

// After
<p className="mt-5 max-w-lg text-sm leading-relaxed text-white/55 sm:text-[15px]">
```

- [ ] **Step 5: Run CI gate**
```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: all pass.

- [ ] **Step 6: Commit**
```bash
rtk git add components/landing/AchievementsSection.tsx components/landing/TestimonialsSection.tsx components/landing/PartnersSection.tsx components/landing/JoinUsSection.tsx
rtk git commit -m "style(public): landing sections — navy color tokens (achievements, testimonials, partners, join)"
```

---

## Task 5: About Page

**Files:**
- Modify: `app/about/page.tsx`

- [ ] **Step 1: Update main background and hero banner**

Line 46 (main bg):
```tsx
// Before
<main className="flex-1 bg-[#070707]">

// After
<main className="flex-1 bg-[#040D1C]">
```

Line 49 (hero banner border):
```tsx
// Before
<div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/5">

// After
<div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/12">
```

- [ ] **Step 2: Update Vision/Mission/Values cards**

Line 79 (card bg — inline style):
```tsx
// Before
style={{ backgroundColor: "#2E2E2E" }}

// After
style={{ backgroundColor: "#0C1E3C" }}
```

Line 85 (card body text):
```tsx
// Before
<p className="text-justify leading-relaxed text-gray-300">{card.body}</p>

// After
<p className="text-justify leading-relaxed text-white/70">{card.body}</p>
```

- [ ] **Step 3: Update alumni card and CTA border**

Line 109 (player card — remove rounded, add border):
The `rounded-xl` is fine to keep. Just ensure photo cards look good on navy — no class changes needed here since the image fills the card.

Line 118 (gradient overlay on photo card):
```tsx
// Before
<div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-5">

// After
<div className="absolute bottom-0 w-full bg-gradient-to-t from-[#040D1C]/90 to-transparent p-5">
```

Line 132 (CTA section border):
```tsx
// Before
<div className="mx-auto max-w-7xl border-t border-white/5 pt-12 text-center">

// After
<div className="mx-auto max-w-7xl border-t border-white/12 pt-12 text-center">
```

- [ ] **Step 4: Run CI gate**
```bash
npm run lint && npm run typecheck && npm run test:unit
```

- [ ] **Step 5: Commit**
```bash
rtk git add app/about/page.tsx
rtk git commit -m "style(public): about page — navy palette"
```

---

## Task 6: Player Profile Page

**Files:**
- Modify: `app/players/[username]/page.tsx`

- [ ] **Step 1: Update main bg + hero section**

Line 99 (main bg):
```tsx
// Before
<main className="flex-1 bg-[#070707]">

// After
<main className="flex-1 bg-[#040D1C]">
```

Line 101 (hero section border):
```tsx
// Before
<section className="relative overflow-hidden border-b border-white/5 px-6 py-16 sm:px-10 lg:px-16">

// After
<section className="relative overflow-hidden border-b border-white/12 px-6 py-16 sm:px-10 lg:px-16">
```

- [ ] **Step 2: Update avatar styles**

Avatar ring (line ~124):
```tsx
// Before
className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-white/10"

// After
className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-[#F5C400]/40"
```

Avatar fallback bg (line ~127):
```tsx
// Before
<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#1E1E1E] text-2xl font-black text-white/30 ring-2 ring-white/5">

// After
<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0C1E3C] text-2xl font-black text-white/50 ring-2 ring-[#F5C400]/30">
```

Username text (line ~135):
```tsx
// Before
<p className="mt-0.5 text-sm text-white/35">@{profile.username}</p>

// After
<p className="mt-0.5 text-sm text-white/55">@{profile.username}</p>
```

Active team label (line ~137):
```tsx
// Before
<span className="text-xs text-white/25">Tim aktif:</span>

// After
<span className="text-xs text-white/45">Tim aktif:</span>
```

Active team name (line ~139):
```tsx
// Before
<span className="text-xs font-semibold text-white/60">{currentOrg.name}</span>

// After
<span className="text-xs font-semibold text-white/75">{currentOrg.name}</span>
```

Role badge (line ~140):
```tsx
// Before
<span className="rounded bg-[#1E1E1E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">

// After
<span className="rounded bg-[#0C1E3C] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
```

- [ ] **Step 3: Update achievement section + rows**

Achievements section (line ~151):
```tsx
// Before
<section className="px-6 py-14 sm:px-10 lg:px-16">

// After — bg already inherited from main, just update row cards
```

Trophy icon (line ~155):
```tsx
// Before
<Trophy className="h-4 w-4 text-white/30" />

// After
<Trophy className="h-4 w-4 text-white/50" />
```

Header label (line ~156):
```tsx
// Before
<h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">

// After
<h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">
```

Achievement row card (line ~166):
```tsx
// Before
className="flex items-center gap-4 border border-white/5 bg-[#0D0D0D] px-5 py-4"

// After
className="flex items-center gap-4 border border-white/12 bg-[#071428] px-5 py-4"
```

Achievement title text (line ~178):
```tsx
// Before
<p className="truncate text-sm font-semibold text-[#E5E2E1]">{a.title}</p>

// After
<p className="truncate text-sm font-semibold text-white">{a.title}</p>
```

Org name under achievement (line ~180):
```tsx
// Before
<p className="mt-0.5 text-[10px] text-white/30">{org.name}</p>

// After
<p className="mt-0.5 text-[10px] text-white/50">{org.name}</p>
```

Year text (line ~190):
```tsx
// Before
<span className="text-[10px] text-white/20">

// After
<span className="text-[10px] text-white/40">
```

Empty state (line ~201):
```tsx
// Before
<div className="border border-white/5 bg-[#0D0D0D] py-14 text-center">

// After
<div className="border border-white/12 bg-[#071428] py-14 text-center">
```

Empty icon + text (lines ~202-203):
```tsx
// Before
<Trophy className="mx-auto mb-3 h-6 w-6 text-white/10" />
<p className="text-sm text-white/25">Belum ada prestasi tercatat.</p>

// After
<Trophy className="mx-auto mb-3 h-6 w-6 text-white/20" />
<p className="text-sm text-white/45">Belum ada prestasi tercatat.</p>
```

- [ ] **Step 4: Run CI gate**
```bash
npm run lint && npm run typecheck && npm run test:unit
```

- [ ] **Step 5: Commit**
```bash
rtk git add "app/players/[username]/page.tsx"
rtk git commit -m "style(public): player profile — navy + yellow avatar ring"
```

---

## Task 7: Gallery + Divisions Pages

**Files:**
- Modify: `app/gallery/page.tsx`
- Modify: `app/divisions/page.tsx`
- Modify: `app/divisions/[slug]/page.tsx`

- [ ] **Step 1: Update gallery page**

In `app/gallery/page.tsx`:

Line 30 (main bg):
```tsx
// Before
<main className="flex-1 bg-[#070707]">

// After
<main className="flex-1 bg-[#040D1C]">
```

Line 32 (hero section border):
```tsx
// Before
<section className="relative overflow-hidden border-b border-white/5 px-6 py-20 sm:px-10 lg:px-16">

// After
<section className="relative overflow-hidden border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
```

Line 51 (description text):
```tsx
// Before
<p className="mt-4 max-w-lg text-sm leading-relaxed text-white/40">

// After
<p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55">
```

Line 64 (gallery card):
```tsx
// Before
className="relative flex flex-col border border-white/5 bg-[#0D0D0D] p-5"

// After
className="relative flex flex-col border border-white/12 bg-[#071428] p-5"
```

Line 82 (meta list):
```tsx
// Before
<ul className="mb-4 space-y-1 text-xs text-white/40">

// After
<ul className="mb-4 space-y-1 text-xs text-white/55">
```

Line 92 (preview image placeholder):
```tsx
// Before
<div className="aspect-video overflow-hidden bg-white/5">

// After
<div className="aspect-video overflow-hidden bg-white/8">
```

Line 103 (empty preview placeholder):
```tsx
// Before
<div className="aspect-video bg-white/[0.03]" />

// After
<div className="aspect-video bg-white/[0.06]" />
```

Line 111 (view more button):
```tsx
// Before
className="inline-flex items-center border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/50 transition hover:border-[#F5C400]/40 hover:text-[#F5C400]"

// After
className="inline-flex items-center border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/60 transition hover:border-[#F5C400]/50 hover:text-[#F5C400]"
```

- [ ] **Step 2: Update divisions list page**

In `app/divisions/page.tsx`:

Line 44 (main bg):
```tsx
// Before
<main className="flex-1 bg-[#070707]">

// After
<main className="flex-1 bg-[#040D1C]">
```

Line 46 (hero section border):
```tsx
// Before
<section className="relative overflow-hidden border-b border-white/5 px-6 py-20 sm:px-10 lg:px-16">

// After
<section className="relative overflow-hidden border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
```

Line 64 (description):
```tsx
// Before
<p className="mt-4 max-w-lg text-sm leading-relaxed text-white/40 sm:text-base">

// After
<p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
```

Line 80 (card):
```tsx
// Before
className="group relative overflow-hidden border border-white/5 bg-[#0D0D0D] transition-all hover:border-white/10"

// After
className="group relative overflow-hidden border border-white/12 bg-[#071428] transition-all hover:border-[#F5C400]/30"
```

Line 92 (game name):
```tsx
// Before
<p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/30">

// After
<p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/50">
```

Line 94 (description):
```tsx
// Before
<p className="mt-4 text-sm leading-relaxed text-white/45">

// After
<p className="mt-4 text-sm leading-relaxed text-white/65">
```

Line 106 (empty state):
```tsx
// Before
<p className="col-span-3 py-20 text-center text-sm text-white/30">

// After
<p className="col-span-3 py-20 text-center text-sm text-white/50">
```

- [ ] **Step 3: Update division detail page**

In `app/divisions/[slug]/page.tsx`:

Line 119 (main bg):
```tsx
// Before
<main className="flex-1 bg-[#070707]">

// After
<main className="flex-1 bg-[#040D1C]">
```

Line 121 (hero section border):
```tsx
// Before
<section className="relative overflow-hidden border-b border-white/5 px-6 py-20 sm:px-10 lg:px-16">

// After
<section className="relative overflow-hidden border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
```

Line 136 (back link):
```tsx
// Before
className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/30 transition hover:text-white"

// After
className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50 transition hover:text-white"
```

Line 154 (game name below abbr):
```tsx
// Before
<p className="mt-2 text-sm font-semibold uppercase tracking-wider text-white/30">

// After
<p className="mt-2 text-sm font-semibold uppercase tracking-wider text-white/55">
```

Line 158 (description):
```tsx
// Before
<p className="mt-4 max-w-lg text-sm leading-relaxed text-white/45">

// After
<p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65">
```

Line 171 (section header):
```tsx
// Before
<Users className="h-4 w-4 text-white/30" />
<h2 className="text-sm font-bold uppercase tracking-widest text-white/30">

// After
<Users className="h-4 w-4 text-white/50" />
<h2 className="text-sm font-bold uppercase tracking-widest text-white/50">
```

Team card (line ~184):
```tsx
// Before
className="group flex flex-col gap-4 border border-white/5 bg-[#0D0D0D] p-5 transition hover:border-white/10"

// After
className="group flex flex-col gap-4 border border-white/12 bg-[#071428] p-5 transition hover:border-[#F5C400]/30"
```

Avatar fallback in player preview (line ~226):
```tsx
// Before
<div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-[8px] font-bold text-white/50">

// After
<div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0C1E3C] text-[8px] font-bold text-white/60">
```

Player list border (line ~215):
```tsx
// Before
<div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">

// After
<div className="flex flex-col gap-1.5 border-t border-white/12 pt-3">
```

Empty teams state (line ~250):
```tsx
// Before
<div className="border border-white/5 bg-[#0D0D0D] py-20 text-center">

// After
<div className="border border-white/12 bg-[#071428] py-20 text-center">
```

Empty state text (line ~251):
```tsx
// Before
<p className="text-sm text-white/30">
<p className="mt-2 text-xs text-white/20">

// After
<p className="text-sm text-white/50">
<p className="mt-2 text-xs text-white/38">
```

- [ ] **Step 4: Run CI gate**
```bash
npm run lint && npm run typecheck && npm run test:unit
```

- [ ] **Step 5: Commit**
```bash
rtk git add app/gallery/page.tsx app/divisions/page.tsx "app/divisions/[slug]/page.tsx"
rtk git commit -m "style(public): gallery + divisions pages — navy palette"
```

---

## Task 8: Visual Verification

- [ ] **Step 1: Start dev server**
```bash
npm run dev
```

- [ ] **Step 2: Check each public page visually**

Open in browser and verify navy background (NOT black) on:
- [ ] `/` — home (hero, divisions grid cards, achievements, testimonials, partners, join)
- [ ] `/about` — about page (hero banner, vision/mission cards now navy-blue)
- [ ] `/gallery` — gallery cards navy
- [ ] `/divisions` — division list page, cards navy
- [ ] `/divisions/<any-slug>` — detail page navy
- [ ] `/players/<any-username>` — player profile, yellow avatar ring visible

- [ ] **Step 3: Check workspace is NOT affected**

Navigate to `/<team-slug>` (workspace) and verify it still uses the dark Notion theme (black, `#191919`). No navy background should appear in workspace routes.

- [ ] **Step 4: Final commit if any small fixes needed**
```bash
rtk git add <changed-files>
rtk git commit -m "style(public): visual fixes from browser verification"
```

---

## Summary

| Task | Files | Type |
|---|---|---|
| 1 | HeaderClient, Footer | Color tokens |
| 2 | HeroSection | Color + gradient |
| 3 | DivisionsSection, DivisionsGrid | **Structural redesign** → card grid |
| 4 | Achievements, Testimonials, Partners, JoinUs | Color tokens |
| 5 | about/page.tsx | Color tokens |
| 6 | players/[username]/page.tsx | Color tokens + yellow ring |
| 7 | gallery/page.tsx, divisions/page.tsx, divisions/[slug]/page.tsx | Color tokens |
| 8 | — | Visual verification |
