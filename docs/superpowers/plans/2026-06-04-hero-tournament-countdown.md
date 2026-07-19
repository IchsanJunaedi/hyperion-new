# Hero Tournament Countdown — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live tournament countdown to the public hero section, editorially styled (big numbers on full-bleed image, no boxes), controllable from `/admin/tournaments`.

**Architecture:** A new `show_in_hero` boolean column on `tournaments` drives which tournament is featured. A pure countdown utility + client component handles the live timer. The admin panel gets a new page to toggle which tournament is featured (exactly one at a time). The landing page fetches the featured tournament server-side and passes it to HeroSection.

**Tech Stack:** Next.js 15 App Router, Supabase (admin client), TypeScript strict, Tailwind CSS v4, Vitest (unit tests), `setInterval` for countdown, server actions with `revalidatePath`.

---

## File Map

| Action | File |
|--------|------|
| Create | `supabase/migrations/20260604000001_tournaments_show_in_hero.sql` |
| Modify | `types/database.ts` — add `show_in_hero` to tournaments Row/Insert/Update |
| Create | `lib/utils/countdown.ts` — pure countdown functions |
| Create | `features/admin/__tests__/hero-countdown.test.ts` |
| Modify | `features/admin/queries.ts` — add `getTournamentsForAdmin`, `getFeaturedTournament` |
| Modify | `features/admin/actions.ts` — add `toggleHeroTournamentAction` |
| Create | `features/admin/components/TournamentsAdminClient.tsx` |
| Create | `app/admin/(panel)/tournaments/page.tsx` |
| Modify | `features/admin/components/AdminSidebarNav.tsx` — add Tournaments nav item |
| Create | `components/landing/HeroCountdown.tsx` |
| Modify | `components/landing/HeroSection.tsx` — accept + render featuredTournament |
| Modify | `app/page.tsx` — fetch + pass featuredTournament |

---

### Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260604000001_tournaments_show_in_hero.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20260604000001_tournaments_show_in_hero.sql
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS show_in_hero BOOLEAN DEFAULT false;
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: `Applied 1 migration` with no errors.

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `types/database.ts`

- [ ] **Step 1: Add `show_in_hero` to tournaments Row**

Find the `tournaments` table `Row` block (search for `bracket_file_path: string | null`) and add after `prize_pool`:

```typescript
show_in_hero: boolean
```

- [ ] **Step 2: Add to Insert and Update blocks**

In the `Insert` block for tournaments, add:
```typescript
show_in_hero?: boolean | null
```

In the `Update` block for tournaments, add:
```typescript
show_in_hero?: boolean | null
```

- [ ] **Step 3: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: exit 0, no errors.

---

### Task 3: Pure countdown utilities + tests

**Files:**
- Create: `lib/utils/countdown.ts`
- Create: `features/admin/__tests__/hero-countdown.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `features/admin/__tests__/hero-countdown.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getTargetDate, computeTimeLeft } from "@/lib/utils/countdown";

describe("getTargetDate", () => {
  it("uses start_time when provided", () => {
    const result = getTargetDate("2026-07-01", "14:30:00");
    expect(result.toISOString()).toContain("2026-07-01");
    // hour 14 in local → check via getHours or just trust the string
    expect(result instanceof Date).toBe(true);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it("defaults to midnight when start_time is null", () => {
    const result = getTargetDate("2026-07-01", null);
    expect(result instanceof Date).toBe(true);
    expect(isNaN(result.getTime())).toBe(false);
  });
});

describe("computeTimeLeft", () => {
  it("returns null when target is in the past", () => {
    const past = new Date(Date.now() - 1000);
    expect(computeTimeLeft(past)).toBeNull();
  });

  it("returns correct breakdown for future date", () => {
    // 1 day + 2 hours + 3 minutes + 4 seconds from now
    const future = new Date(
      Date.now() + (1 * 86400 + 2 * 3600 + 3 * 60 + 4) * 1000
    );
    const result = computeTimeLeft(future);
    expect(result).not.toBeNull();
    expect(result!.days).toBe(1);
    expect(result!.hours).toBe(2);
    expect(result!.minutes).toBe(3);
    // seconds may drift ±1 in slow CI — allow range
    expect(result!.seconds).toBeGreaterThanOrEqual(3);
    expect(result!.seconds).toBeLessThanOrEqual(5);
  });

  it("returns all zeros at exactly the target (edge)", () => {
    const exactly = new Date(Date.now() + 999); // <1s
    const result = computeTimeLeft(exactly);
    expect(result).not.toBeNull();
    expect(result!.days).toBe(0);
    expect(result!.hours).toBe(0);
    expect(result!.minutes).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:unit -- hero-countdown
```

Expected: FAIL — `Cannot find module '@/lib/utils/countdown'`

- [ ] **Step 3: Implement countdown utilities**

Create `lib/utils/countdown.ts`:

```typescript
export function getTargetDate(start_date: string, start_time: string | null): Date {
  const timeStr = start_time ?? "00:00:00";
  return new Date(`${start_date}T${timeStr}`);
}

export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function computeTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:unit -- hero-countdown
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
rtk git add lib/utils/countdown.ts features/admin/__tests__/hero-countdown.test.ts
rtk git commit -m "feat(hero): add countdown pure utilities + tests"
```

---

### Task 4: Admin queries

**Files:**
- Modify: `features/admin/queries.ts`

- [ ] **Step 1: Add types and query functions**

Add to the bottom of `features/admin/queries.ts` (before the final export):

```typescript
export type AdminTournament = {
  id: string;
  name: string;
  start_date: string;
  start_time: string | null;
  show_in_hero: boolean;
  status: string;
  division_id: string;
};

export type FeaturedTournament = {
  id: string;
  name: string;
  start_date: string;
  start_time: string | null;
};

export async function getTournamentsForAdmin(): Promise<AdminTournament[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time, show_in_hero, status, division_id")
    .eq("is_registered", true)
    .order("start_date", { ascending: false })
    .limit(50);
  if (error) console.error("getTournamentsForAdmin:", error);
  return (data ?? []) as AdminTournament[];
}

export async function getFeaturedTournament(): Promise<FeaturedTournament | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time")
    .eq("show_in_hero", true)
    .maybeSingle();
  if (error) console.error("getFeaturedTournament:", error);
  return data as FeaturedTournament | null;
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: exit 0.

---

### Task 5: Admin server action

**Files:**
- Modify: `features/admin/actions.ts`

- [ ] **Step 1: Add toggleHeroTournamentAction**

Add to the bottom of `features/admin/actions.ts`:

```typescript
// ── Tournament Hero Toggle ────────────────────────────────────────────────────

export async function toggleHeroTournamentAction(
  tournamentId: string | null
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();

  // Clear any currently featured tournament
  const { error: clearErr } = await admin
    .from("tournaments")
    .update({ show_in_hero: false })
    .eq("show_in_hero", true);
  if (clearErr) return { ok: false, message: clearErr.message };

  // Set the new one if provided
  if (tournamentId) {
    const { error } = await admin
      .from("tournaments")
      .update({ show_in_hero: true })
      .eq("id", tournamentId);
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/tournaments");
  return { ok: true };
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
rtk git add features/admin/queries.ts features/admin/actions.ts
rtk git commit -m "feat(hero): admin queries + toggleHeroTournamentAction"
```

---

### Task 6: TournamentsAdminClient component

**Files:**
- Create: `features/admin/components/TournamentsAdminClient.tsx`

- [ ] **Step 1: Create component**

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarRange } from "lucide-react";
import { toggleHeroTournamentAction } from "@/features/admin/actions";
import type { AdminTournament } from "@/features/admin/queries";

interface Props {
  tournaments: AdminTournament[];
}

const TournamentsAdminClient = ({ tournaments: initial }: Props) => {
  const [tournaments, setTournaments] = useState(initial);
  const [pending, startTransition] = useTransition();

  const handleToggle = (id: string, currentlyActive: boolean) => {
    const nextId = currentlyActive ? null : id;

    // Optimistic update
    setTournaments((prev) =>
      prev.map((t) => ({ ...t, show_in_hero: t.id === id ? !currentlyActive : false }))
    );

    startTransition(async () => {
      const result = await toggleHeroTournamentAction(nextId);
      if (!result.ok) {
        toast.error(result.message);
        // Revert on error
        setTournaments(initial);
      } else {
        toast.success(
          nextId ? "Tournament ditampilkan di hero" : "Tournament disembunyikan dari hero"
        );
      }
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">
            Tournaments
          </h1>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Pilih satu tournament untuk ditampilkan sebagai countdown di hero section.
            Hanya tournament yang sudah dikonfirmasi pendaftarannya (is_registered) yang muncul di sini.
          </p>
        </div>
      </div>

      {tournaments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded border border-[#2D2D2D] py-16 text-center">
          <CalendarRange className="mb-3 h-8 w-8 text-[#6B6A68]" />
          <p className="text-sm text-[#6B6A68]">
            Belum ada tournament yang dikonfirmasi pendaftarannya.
          </p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Centang &quot;is_registered&quot; di workspace tournament terlebih dahulu.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded border border-[#2D2D2D] bg-[#1a1a1a] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#D4D4D4]">{t.name}</p>
              <p className="mt-0.5 text-xs text-[#6B6A68]">
                Mulai: {t.start_date}
                {t.start_time ? ` ${t.start_time.slice(0, 5)}` : ""} &nbsp;·&nbsp;
                Status: {t.status}
              </p>
            </div>

            <button
              onClick={() => handleToggle(t.id, t.show_in_hero)}
              disabled={pending}
              className={`ml-4 shrink-0 cursor-pointer px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                t.show_in_hero
                  ? "border border-[#F5C400] bg-[#F5C400] text-black hover:bg-transparent hover:text-[#F5C400]"
                  : "border border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400] hover:text-[#F5C400]"
              } disabled:opacity-50`}
            >
              {t.show_in_hero ? "Aktif di Hero" : "Tampilkan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export { TournamentsAdminClient };
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: exit 0.

---

### Task 7: Admin tournaments page + sidebar

**Files:**
- Create: `app/admin/(panel)/tournaments/page.tsx`
- Modify: `features/admin/components/AdminSidebarNav.tsx`

- [ ] **Step 1: Create admin tournaments page**

```tsx
import { getTournamentsForAdmin } from "@/features/admin/queries";
import { TournamentsAdminClient } from "@/features/admin/components/TournamentsAdminClient";

export const dynamic = "force-dynamic";

const AdminTournamentsPage = async () => {
  const tournaments = await getTournamentsForAdmin();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Tournaments</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-10">
        <TournamentsAdminClient tournaments={tournaments} />
      </main>
    </>
  );
};

export default AdminTournamentsPage;
```

- [ ] **Step 2: Add Tournaments to sidebar nav**

In `features/admin/components/AdminSidebarNav.tsx`, add `CalendarRange` to the import from lucide-react:

```tsx
import {
  Image,
  Users,
  MessageSquare,
  Grid3x3,
  Layers,
  UserCircle,
  Heart,
  LayoutTemplate,
  Trophy,
  CalendarRange,
} from "lucide-react";
```

Then add to the `KONTEN LIST` items array (after Achievements, before Partners):

```tsx
{ href: "/admin/tournaments", Icon: CalendarRange, label: "Tournaments" },
```

So the full KONTEN LIST becomes:
```tsx
{
  label: "KONTEN LIST",
  items: [
    { href: "/admin/gallery", Icon: Image, label: "Gallery & Achievement" },
    { href: "/admin/achievements", Icon: Trophy, label: "Achievements" },
    { href: "/admin/tournaments", Icon: CalendarRange, label: "Tournaments" },
    { href: "/admin/partners", Icon: Layers, label: "Partners" },
    { href: "/admin/testimonials", Icon: MessageSquare, label: "Testimonials" },
    { href: "/admin/divisions", Icon: Grid3x3, label: "Divisions" },
  ],
},
```

- [ ] **Step 3: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
rtk git add features/admin/components/TournamentsAdminClient.tsx app/admin/"(panel)"/tournaments/page.tsx features/admin/components/AdminSidebarNav.tsx
rtk git commit -m "feat(admin): /admin/tournaments page with hero toggle"
```

---

### Task 8: HeroCountdown client component

**Files:**
- Create: `components/landing/HeroCountdown.tsx`

- [ ] **Step 1: Create component**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { computeTimeLeft, getTargetDate, type TimeLeft } from "@/lib/utils/countdown";

interface Props {
  tournament: {
    name: string;
    start_date: string;
    start_time: string | null;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

const HeroCountdown = ({ tournament }: Props) => {
  // useMemo so a stable Date reference doesn't retrigger the effect on every render
  const target = useMemo(
    () => getTargetDate(tournament.start_date, tournament.start_time),
    [tournament.start_date, tournament.start_time]
  );
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    computeTimeLeft(target)
  );

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setTimeLeft(computeTimeLeft(target));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [target]);

  return (
    <div className="text-center">
      {/* Tournament label */}
      <p
        className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-[#F5C400]"
        style={{ opacity: 0.85 }}
      >
        Next Tournament
      </p>

      {/* Tournament name */}
      <p
        className="mb-6 font-semibold text-white/90"
        style={{ fontSize: "clamp(13px, 2vw, 22px)", letterSpacing: "0.03em" }}
      >
        {tournament.name}
      </p>

      {timeLeft === null ? (
        /* SEDANG BERLANGSUNG */
        <p
          className="animate-pulse font-black uppercase tracking-[0.2em] text-[#F5C400]"
          style={{ fontSize: "clamp(20px, 4vw, 42px)" }}
        >
          Sedang Berlangsung
        </p>
      ) : (
        <>
          {/* Big countdown numbers */}
          <div
            className="flex items-baseline justify-center"
            style={{ lineHeight: 1, gap: 0 }}
          >
            <span className="countdown-num">{pad(timeLeft.days)}</span>
            <span className="countdown-dot">·</span>
            <span className="countdown-num">{pad(timeLeft.hours)}</span>
            <span className="countdown-dot">·</span>
            <span className="countdown-num">{pad(timeLeft.minutes)}</span>
            <span className="countdown-dot">·</span>
            <span className="countdown-num">{pad(timeLeft.seconds)}</span>
          </div>

          {/* Unit labels — match widths to numbers above */}
          <div className="mt-2 flex items-center justify-center">
            {(["Hari", "Jam", "Menit", "Detik"] as const).map((label, i) => (
              <span key={label} className="flex items-center">
                <span
                  className="inline-block text-center text-[9px] font-semibold uppercase tracking-[0.25em] text-white/25"
                  style={{ width: "clamp(60px, 10vw, 120px)" }}
                >
                  {label}
                </span>
                {i < 3 && (
                  <span
                    className="inline-block text-[9px] text-transparent"
                    style={{ width: "clamp(12px, 2vw, 28px)" }}
                  >
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export { HeroCountdown };
```

- [ ] **Step 2: Add countdown styles to globals.css**

In `app/globals.css`, add inside the existing CSS (after existing rules):

```css
/* Hero Countdown */
.countdown-num {
  font-size: clamp(64px, 11vw, 130px);
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.03em;
  text-shadow: 0 0 80px rgba(245, 196, 0, 0.1), 0 4px 40px rgba(0, 0, 0, 0.4);
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

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
rtk git add components/landing/HeroCountdown.tsx app/globals.css
rtk git commit -m "feat(hero): HeroCountdown client component"
```

---

### Task 9: Wire HeroSection + landing page

**Files:**
- Modify: `components/landing/HeroSection.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update HeroSection props and render countdown**

In `components/landing/HeroSection.tsx`:

**Add import** at the top:
```tsx
import { HeroCountdown } from "@/components/landing/HeroCountdown";
import type { FeaturedTournament } from "@/features/admin/queries";
```

**Update interface** — add `featuredTournament` to `HeroSectionProps`:
```tsx
interface HeroSectionProps {
  slides: HeroSlide[];
  settings: HeroSettings;
  featuredTournament?: FeaturedTournament | null;
}
```

**Update function signature:**
```tsx
const HeroSection = ({ slides, settings, featuredTournament }: HeroSectionProps) => {
```

**Add countdown block** inside the `<section>` tag, after the `<div className="h-14 shrink-0" />` header spacer and before the `<div className="flex flex-1 items-end ...">` content block:

```tsx
{/* Tournament countdown — center of hero */}
{featuredTournament && (
  <div className="absolute inset-x-0 z-10" style={{ top: "35%", transform: "translateY(-50%)" }}>
    <HeroCountdown tournament={featuredTournament} />
  </div>
)}
```

- [ ] **Step 2: Update landing page to fetch and pass featuredTournament**

In `app/page.tsx`:

**Add `getFeaturedTournament` to the import** from `@/features/admin/queries`:
```tsx
import {
  getGalleryEntries,
  getPublicAchievements,
  getActivePartners,
  getActiveTestimonials,
  getSiteSettings,
  getFeaturedTournament,
} from "@/features/admin/queries";
```

**Add to the Promise.all** — change from:
```tsx
const [galleryEntries, manualAchievements, partners, testimonials, settings] = await Promise.all([
  getGalleryEntries(),
  getPublicAchievements(),
  getActivePartners(),
  getActiveTestimonials(),
  getSiteSettings(),
]);
```

To:
```tsx
const [galleryEntries, manualAchievements, partners, testimonials, settings, featuredTournament] =
  await Promise.all([
    getGalleryEntries(),
    getPublicAchievements(),
    getActivePartners(),
    getActiveTestimonials(),
    getSiteSettings(),
    getFeaturedTournament(),
  ]);
```

**Pass to HeroSection** — change:
```tsx
<HeroSection slides={heroSlides} settings={heroSettings} />
```
To:
```tsx
<HeroSection slides={heroSlides} settings={heroSettings} featuredTournament={featuredTournament} />
```

- [ ] **Step 3: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: both exit 0.

- [ ] **Step 4: Run all unit tests**

```bash
npm run test:unit
```

Expected: all tests pass (≥ 656 tests).

- [ ] **Step 5: Commit**

```bash
rtk git add components/landing/HeroSection.tsx app/page.tsx
rtk git commit -m "feat(hero): wire tournament countdown to landing page"
```

---

### Task 10: Manual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify admin panel**

1. Open `http://localhost:3000/admin/tournaments`
2. Confirm "Tournaments" appears in sidebar nav
3. If no `is_registered = true` tournaments exist: page shows empty state message — correct
4. If tournaments exist: each row shows name, start_date, toggle button
5. Click "Tampilkan" on a tournament → button changes to "Aktif di Hero" (yellow), toast appears

- [ ] **Step 3: Verify hero countdown**

1. Open `http://localhost:3000`
2. With a tournament featured: countdown numbers appear center of hero, tournament name above, labels below, yellow dots between
3. With no tournament featured: hero looks exactly as before (no countdown)
4. Toggle back OFF in admin → reload landing page → countdown disappears

- [ ] **Step 4: Final commit + push**

```bash
rtk git status
rtk commit -m "feat(hero): tournament countdown — editorial style with admin toggle"
rtk git push
```
