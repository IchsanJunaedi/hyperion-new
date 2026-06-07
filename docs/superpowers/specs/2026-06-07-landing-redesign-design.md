# Landing Page Redesign — Design Spec

> Inspired by gamingonavax.com visual language, adapted for Hyperion Team with gold #F5C400 accent instead of cyan.

## Color System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0A0A0A` | All landing sections (replaces `#040D1C`) |
| Surface/Card | `rgba(255,255,255,0.04)` | Glassmorphism card fill |
| Card border | `rgba(255,255,255,0.08)` | Default card border |
| Card border hover | `rgba(245,196,0,0.30)` | Hover state |
| Gold glow | `rgba(245,196,0,0.08)` | Box-shadow on hover |
| Header bg | `rgba(10,10,10,0.88)` | Sticky header + backdrop-blur |
| Header border | `rgba(245,196,0,0.10)` | Bottom border |
| Accent | `#F5C400` | All gold text, badges, indicators |

## Texture System (signature gamingonavax patterns)

Three layers stacked inside every section, all `pointer-events-none absolute inset-0`:

1. **Grid dots** — `radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)` at `28px 28px`, opacity `4%`
2. **Plus pattern** — inline SVG crosses, opacity `2.5%`
3. **Gold radial glow** — `radial-gradient(ellipse 900px 600px at 50% 0%, rgba(245,196,0,0.07) 0%, transparent 70%)`

Shared components: `GridTexture`, `PlusTexture`, `GoldRadialGlow` in `components/landing/LandingTextures.tsx`.

## Typography

Keep Instrument Sans. Push toward gaming aesthetic:
- Section labels: `text-[10px] font-bold uppercase tracking-[0.4em]` + gold `border-l-2 border-[#F5C400] pl-3`
- Section headers: unchanged (already bold uppercase)
- Countdown numbers: enhanced `text-shadow` gold glow

## Component Designs

### Header (HeaderClient.tsx)
- Sticky, `backdrop-blur-md bg-[#0A0A0A]/88`
- Border bottom: `border-[#F5C400]/10`
- Active nav underline: existing `layoutId="nav-underline"` — keep, already gold
- Mobile drawer: `bg-[#0A0A0A]`

### Hero (HeroSection.tsx + HeroCountdown.tsx)
- BG: `#0A0A0A`
- 3 texture layers (GridTexture + PlusTexture + GoldRadialGlow)
- Countdown numbers: enhanced gold text-shadow via `.countdown-num` class update in globals.css
- Glassmorphism card wrapper around countdown: `bg-white/[0.04] backdrop-blur-sm border border-[#F5C400]/15 px-10 py-8`

### Upcoming Matches (UpcomingMatchesSection.tsx)
- Section bg: `#0A0A0A`, texture overlays
- Cards: `bg-white/[0.04] backdrop-blur-sm border border-white/[0.08]`
- Hover: `border-[#F5C400]/30 shadow-[0_0_24px_rgba(245,196,0,0.07)]`
- Remove `bg-[#071428]` / `bg-[#0C1E3C]` fills

### Divisions (DivisionsSection.tsx)
- Section bg: `#0A0A0A`, texture overlays
- Cards: `bg-white/[0.04] backdrop-blur-sm border border-white/[0.08]`
- Hover: `border-[#F5C400]/30 shadow-[0_0_20px_rgba(245,196,0,0.06)]`

### Achievements (AchievementsSection.tsx)
- Section bg: `#0A0A0A`, texture overlays
- Row hover: subtle `bg-white/[0.03]`
- `#1` placement label: `text-shadow: 0 0 16px rgba(245,196,0,0.6)` via inline style
- Lightbox unchanged

### Latest News (LatestNewsSection.tsx)
- gamingonavax card treatment: image fills full card, then `absolute` dark overlay `bg-gradient-to-t from-black/90 via-black/40 to-transparent`
- Text content: absolute bottom, white text on gradient
- Date chip: gold badge top-left absolute on image
- No separate content padding block — fully overlaid

### Testimonials (TestimonialsSection.tsx) — FULL REWRITE
- **Remove**: 2-col layout (photo left + quote right)
- **New**: vertical stacked cards, each full-width `min-h-[320px]`
- Each card: `relative overflow-hidden`
  - Background: `<img>` absolute fill with `filter: blur(8px) brightness(0.25) saturate(0.5) scale(1.05)`
  - Dark overlay: `absolute inset-0 bg-black/70`
  - Content: `relative z-10 flex flex-col justify-between p-8 min-h-[320px]`
  - Large quote mark: `"` in gold, `text-6xl`
  - Quote text: `text-lg text-white/85 leading-relaxed max-w-2xl`
  - Author row: small circular avatar + name + role, bottom of card
- Show all testimonials as cards (no carousel). Cards alternate `lg:flex-row` / `lg:flex-row-reverse` layout for visual variety
- Keep existing `AnimatePresence` for inView fade-in

### Partners & Sponsors (PartnersSection.tsx) — FULL REWRITE
- **Remove**: static grid
- **New**: dual-row infinite scroll carousel (exactly gamingonavax)
  - Row 1: array duplicated (`[...partners, ...partners]`), animates `scroll-left`
  - Row 2: same array reversed, animates `scroll-right`
  - Each logo: `h-10 w-auto object-contain grayscale opacity-30 hover:grayscale-0 hover:opacity-80 transition-all`
  - `overflow-hidden` on container, `flex gap-12` on scrolling row
  - Hover on container: `animation-play-state: paused` via CSS

### Join Us (JoinUsSection.tsx)
- Section bg: `#0A0A0A`
- Add `GridTexture` + `PlusTexture` + `GoldRadialGlow` (center version)
- Gold radial glow at center: `radial-gradient(ellipse 700px 500px at 50% 50%, rgba(245,196,0,0.07) 0%, transparent 70%)`
- Border box: keep `border-t border-b border-[#F5C400]/15`
- Second CTA button: add "Lihat Divisi" outline button next to existing JoinModal

### Footer (Footer.tsx)
- Change `bg-[#040D1C]` → `bg-[#0A0A0A]`
- Add `GridTexture opacity-2`
- Gold hashtag: `text-[#F5C400]` with subtle `text-shadow: 0 0 12px rgba(245,196,0,0.4)`

## CSS Additions (globals.css)
```css
@keyframes scroll-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes scroll-right {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}
.animate-scroll-left { animation: scroll-left 30s linear infinite; }
.animate-scroll-right { animation: scroll-right 35s linear infinite; }
.partners-track:hover .animate-scroll-left,
.partners-track:hover .animate-scroll-right { animation-play-state: paused; }

/* Enhanced countdown glow */
/* (replace existing .countdown-num text-shadow) */
.countdown-num {
  text-shadow: 0 0 60px rgba(245,196,0,0.30), 0 0 120px rgba(245,196,0,0.10), 0 4px 40px rgba(0,0,0,0.4);
}
```

## Section Order (unchanged from existing page.tsx)
1. Header
2. HeroSection (+ countdown)
3. UpcomingMatchesSection
4. DivisionsSection
5. AchievementsSection
6. LatestNewsSection
7. TestimonialsSection
8. PartnersSection
9. JoinUsSection
10. Footer

## Files Touched
- `app/globals.css`
- `components/landing/LandingTextures.tsx` (NEW)
- `components/landing/HeaderClient.tsx`
- `components/landing/HeroSection.tsx`
- `components/landing/HeroCountdown.tsx`
- `components/landing/UpcomingMatchesSection.tsx`
- `components/landing/DivisionsSection.tsx`
- `components/landing/AchievementsSection.tsx`
- `components/landing/LatestNewsSection.tsx`
- `components/landing/TestimonialsSection.tsx`
- `components/landing/PartnersSection.tsx`
- `components/landing/JoinUsSection.tsx`
- `components/landing/Footer.tsx`
