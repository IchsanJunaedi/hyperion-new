# Landing GSAP Polish — Design

**Date:** 2026-06-12
**Scope:** Polish menyeluruh (approved): SplitText hero headline + scroll-reveal konsisten di landing sections.

## Context

Landing (`app/page.tsx`) sections: Hero, Divisions, Achievements, LatestNews, Testimonials, Partners, JoinUs. GSAP sudah terpasang (`lib/gsap.ts` registers ScrollTrigger). AchievementsSection sudah punya animasi wave-marquee penuh (gsap.set per frame) — di-skip agar tidak konflik. Counter count-up tidak applicable: tidak ada elemen angka statistik di landing.

`hero_tagline` setting tidak dirender oleh `HeroSection` saat ini — headline aktual adalah nama turnamen terdekat (`h2.font-bebas`). SplitText diterapkan ke headline itu.

## Design

1. **`lib/gsap.ts`** — register `SplitText` (public sejak GSAP 3.13). Export `SplitText`.
2. **`components/landing/Reveal.tsx`** (baru, client) — wrapper `<div>` reusable. Props: `children`, `delay?`, `y?` (default 24). `gsap.fromTo(autoAlpha 0→1, y→0, 0.7s power3.out)` dengan ScrollTrigger `start: "top bottom-=80"`, `once: true`. Dibungkus `gsap.matchMedia("(prefers-reduced-motion: no-preference)")` — reduced-motion users dan no-JS users melihat konten langsung (initial state diset via GSAP, bukan CSS).
3. **`app/page.tsx`** — bungkus DivisionsSection, LatestNewsSection, TestimonialsSection, PartnersSection, JoinUsSection dengan `<Reveal>`.
4. **`HeroSection.tsx`** — tambah class `hero-title` ke headline h2 + fallback span. SplitText `type: "words"`, stagger 0.06s, `yPercent: 60` + autoAlpha rise on mount. Semua animasi hero (termasuk card slide-in existing) dipindah ke dalam `matchMedia` no-preference guard.

## Not in scope

- AchievementsSection (sudah teranimasi, konflik per-frame gsap.set)
- Pinned horizontal scroll / parallax multi-layer (opsi Cinematic ditolak)
- Unit tests (komponen visual TSX, di luar coverage scope — konsisten dengan chart components)

## Verification

`npm run lint` (0 errors) + `npm run typecheck` + `npm run test:unit:coverage` (threshold) + `npm run build`.
