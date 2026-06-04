# Public Schedule + Upcoming Matches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `show_on_schedule` toggle to tournaments, a public `/schedule` page with countdown, an "Upcoming Matches" section on the home page, and update the hero countdown to use public tournaments automatically.

**Architecture:** One new DB column (`show_on_schedule`) drives three surfaces: hero countdown (nearest), home upcoming section (3 cards), and /schedule page (full list grouped by month). Admin toggles per tournament in the existing admin panel. All public pages are server components that call new queries; countdown widgets are `"use client"` components using existing `computeTimeLeft`/`getTargetDate` utilities.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres), Tailwind CSS v4, motion/react. Reuses `@/lib/utils/countdown` utilities, `FeaturedTournament` type, HMR-safe `const X = ...; export { X }` pattern.

---

## Pre-Commit CI Gate (run before EVERY commit)

```bash
npm run lint && npm run typecheck && npm run test:unit
```
All three must pass. Fix failures before committing.

---

## File Map

| Action | File |
|---|---|
| Create | `supabase/migrations/20260604120000_tournaments_show_on_schedule.sql` |
| Modify | `types/database.ts` — add `show_on_schedule` to tournaments Row/Insert/Update |
| Modify | `features/admin/queries.ts` — add `PublicTournament` type + 3 queries + update `AdminTournament` + `getTournamentsForAdmin` |
| Modify | `features/admin/actions.ts` — add `toggleTournamentScheduleAction` |
| Modify | `features/admin/components/TournamentsAdminClient.tsx` — add Publik toggle button |
| Create | `components/landing/ScheduleCountdown.tsx` — client countdown for /schedule page |
| Create | `app/schedule/page.tsx` — public schedule page |
| Create | `components/landing/UpcomingMatchesSection.tsx` — home upcoming matches section |
| Modify | `app/page.tsx` — add upcoming section, update hero countdown source |
| Modify | `components/landing/Header.tsx` — add Schedule to DEFAULT_NAV |

---

## Task 1: DB Migration + Types

**Files:**
- Create: `supabase/migrations/20260604120000_tournaments_show_on_schedule.sql`
- Modify: `types/database.ts`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/20260604120000_tournaments_show_on_schedule.sql`:
```sql
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS show_on_schedule boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Push migration**

```bash
npx supabase db push
```
Expected: "Applying migration 20260604120000_tournaments_show_on_schedule.sql" with no errors.

- [ ] **Step 3: Update types/database.ts**

Find the `tournaments` table Row type (search for `show_in_hero: boolean`) and add `show_on_schedule` on the line after:

```ts
// In Row block — find this:
show_in_hero: boolean
// Add after:
show_on_schedule: boolean
```

```ts
// In Insert block — find this:
show_in_hero?: boolean | null
// Add after:
show_on_schedule?: boolean | null
```

```ts
// In Update block — find this:
show_in_hero?: boolean | null
// Add after:
show_on_schedule?: boolean | null
```

- [ ] **Step 4: Run CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260604120000_tournaments_show_on_schedule.sql types/database.ts
git commit -m "feat(schedule): add show_on_schedule column to tournaments"
```

---

## Task 2: Queries + Types

**Files:**
- Modify: `features/admin/queries.ts`

- [ ] **Step 1: Add `PublicTournament` type and update `AdminTournament`**

In `features/admin/queries.ts`, find the `AdminTournament` type and add `show_on_schedule`:

```ts
export type AdminTournament = {
  id: string;
  name: string;
  start_date: string;
  start_time: string | null;
  show_in_hero: boolean;
  show_on_schedule: boolean;
  status: string;
  division_id: string;
};
```

Then add the new `PublicTournament` type right after `FeaturedTournament`:

```ts
export type PublicTournament = {
  id: string;
  name: string;
  start_date: string;
  start_time: string | null;
  status: string;
  organizer: string | null;
  prize_pool: string | null;
  registration_url: string | null;
  division_name: string | null;
  game: string | null;
};
```

- [ ] **Step 2: Update `getTournamentsForAdmin` to select `show_on_schedule`**

Find `getTournamentsForAdmin` and update the select string:

```ts
export async function getTournamentsForAdmin(): Promise<AdminTournament[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time, show_in_hero, show_on_schedule, status, division_id")
    .eq("is_registered", true)
    .order("start_date", { ascending: false })
    .limit(50);
  if (error) console.error("getTournamentsForAdmin:", error);
  return (data ?? []) as AdminTournament[];
}
```

- [ ] **Step 3: Add the three new public tournament queries**

Add these three functions at the bottom of `features/admin/queries.ts`:

```ts
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type RawPublicRow = {
  id: string;
  name: string;
  start_date: string;
  start_time: string | null;
  status: string;
  organizer: string | null;
  prize_pool: string | null;
  registration_url: string | null;
  divisions: { name: string; game: string | null } | null;
};

function mapPublicRow(row: RawPublicRow): PublicTournament {
  return {
    id: row.id,
    name: row.name,
    start_date: row.start_date,
    start_time: row.start_time,
    status: row.status,
    organizer: row.organizer,
    prize_pool: row.prize_pool,
    registration_url: row.registration_url,
    division_name: row.divisions?.name ?? null,
    game: row.divisions?.game ?? null,
  };
}

export async function getScheduleTournaments(): Promise<PublicTournament[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time, status, organizer, prize_pool, registration_url, divisions(name, game)")
    .eq("show_on_schedule", true)
    .gte("start_date", todayISO())
    .order("start_date", { ascending: true })
    .limit(50);
  if (error) console.error("getScheduleTournaments:", error);
  return ((data ?? []) as unknown as RawPublicRow[]).map(mapPublicRow);
}

export async function getUpcomingPublicTournaments(limit = 3): Promise<PublicTournament[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time, status, organizer, prize_pool, registration_url, divisions(name, game)")
    .eq("show_on_schedule", true)
    .gte("start_date", todayISO())
    .order("start_date", { ascending: true })
    .limit(limit);
  if (error) console.error("getUpcomingPublicTournaments:", error);
  return ((data ?? []) as unknown as RawPublicRow[]).map(mapPublicRow);
}

export async function getNearestPublicTournament(): Promise<PublicTournament | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time, status, organizer, prize_pool, registration_url, divisions(name, game)")
    .eq("show_on_schedule", true)
    .gte("start_date", todayISO())
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) console.error("getNearestPublicTournament:", error);
  if (!data) return null;
  return mapPublicRow(data as unknown as RawPublicRow);
}
```

- [ ] **Step 4: Run CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add features/admin/queries.ts
git commit -m "feat(schedule): add PublicTournament type + schedule queries"
```

---

## Task 3: Server Action

**Files:**
- Modify: `features/admin/actions.ts`

- [ ] **Step 1: Add `toggleTournamentScheduleAction`**

In `features/admin/actions.ts`, find `toggleHeroTournamentAction` and add the new action directly after it:

```ts
export async function toggleTournamentScheduleAction(
  tournamentId: string,
  nextValue: boolean
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();

  const { error } = await admin
    .from("tournaments")
    .update({ show_on_schedule: nextValue })
    .eq("id", tournamentId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/admin/tournaments");
  return { ok: true };
}
```

- [ ] **Step 2: Run CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```

- [ ] **Step 3: Commit**

```bash
git add features/admin/actions.ts
git commit -m "feat(schedule): add toggleTournamentScheduleAction server action"
```

---

## Task 4: Admin UI — Publik Toggle

**Files:**
- Modify: `features/admin/components/TournamentsAdminClient.tsx`

- [ ] **Step 1: Add schedule toggle to TournamentsAdminClient**

Replace the entire file content with:

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarRange } from "lucide-react";
import { toggleHeroTournamentAction, toggleTournamentScheduleAction } from "@/features/admin/actions";
import type { AdminTournament } from "@/features/admin/queries";

interface Props {
  tournaments: AdminTournament[];
}

const TournamentsAdminClient = ({ tournaments: initial }: Props) => {
  const [tournaments, setTournaments] = useState(initial);
  const [pending, startTransition] = useTransition();

  const handleToggleHero = (id: string, currentlyActive: boolean) => {
    const nextValue = !currentlyActive;
    setTournaments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, show_in_hero: nextValue } : t))
    );
    startTransition(async () => {
      const result = await toggleHeroTournamentAction(id, nextValue);
      if (!result.ok) {
        toast.error(result.message);
        setTournaments((prev) =>
          prev.map((t) => (t.id === id ? { ...t, show_in_hero: currentlyActive } : t))
        );
      } else {
        toast.success(nextValue ? "Ditampilkan di hero" : "Disembunyikan dari hero");
      }
    });
  };

  const handleToggleSchedule = (id: string, currentlyActive: boolean) => {
    const nextValue = !currentlyActive;
    setTournaments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, show_on_schedule: nextValue } : t))
    );
    startTransition(async () => {
      const result = await toggleTournamentScheduleAction(id, nextValue);
      if (!result.ok) {
        toast.error(result.message);
        setTournaments((prev) =>
          prev.map((t) => (t.id === id ? { ...t, show_on_schedule: currentlyActive } : t))
        );
      } else {
        toast.success(nextValue ? "Tournament dipublikasikan ke schedule" : "Tournament disembunyikan dari schedule");
      }
    });
  };

  const heroCount = tournaments.filter((t) => t.show_in_hero).length;
  const scheduleCount = tournaments.filter((t) => t.show_on_schedule).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">
            Tournaments
          </h1>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Toggle <span className="text-white/60">Hero</span> untuk countdown di landing page.
            Toggle <span className="text-[#F5C400]/80">Publik</span> untuk tampil di /schedule dan upcoming matches.
          </p>
          <div className="mt-1.5 flex items-center gap-4">
            {heroCount > 0 && (
              <p className="text-xs font-semibold text-white/50">{heroCount} di hero</p>
            )}
            {scheduleCount > 0 && (
              <p className="text-xs font-semibold text-[#F5C400]">{scheduleCount} publik</p>
            )}
          </div>
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
            className={`flex items-center justify-between rounded border px-4 py-3 transition ${
              t.show_on_schedule
                ? "border-[#F5C400]/30 bg-[#1a1800]"
                : "border-[#2D2D2D] bg-[#1a1a1a]"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#D4D4D4]">{t.name}</p>
              <p className="mt-0.5 text-xs text-[#6B6A68]">
                Mulai: {t.start_date}
                {t.start_time ? ` ${t.start_time.slice(0, 5)}` : ""} &nbsp;·&nbsp;
                Status: {t.status}
              </p>
            </div>

            <div className="ml-4 flex shrink-0 items-center gap-2">
              {/* Hero toggle */}
              <button
                onClick={() => handleToggleHero(t.id, t.show_in_hero)}
                disabled={pending}
                className={`cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${
                  t.show_in_hero
                    ? "border border-white/40 bg-white/10 text-white"
                    : "border border-[#2D2D2D] text-[#6B6A68] hover:border-white/30 hover:text-white/60"
                }`}
              >
                {t.show_in_hero ? "Hero ✓" : "Hero"}
              </button>

              {/* Schedule / Publik toggle */}
              <button
                onClick={() => handleToggleSchedule(t.id, t.show_on_schedule)}
                disabled={pending}
                className={`cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${
                  t.show_on_schedule
                    ? "border border-[#F5C400] bg-[#F5C400] text-black"
                    : "border border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400]/50 hover:text-[#F5C400]"
                }`}
              >
                {t.show_on_schedule ? "Publik ✓" : "Publik"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export { TournamentsAdminClient };
```

- [ ] **Step 2: Run CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```

- [ ] **Step 3: Commit**

```bash
git add features/admin/components/TournamentsAdminClient.tsx
git commit -m "feat(schedule): admin UI — add Publik toggle for show_on_schedule"
```

---

## Task 5: ScheduleCountdown Component

**Files:**
- Create: `components/landing/ScheduleCountdown.tsx`

- [ ] **Step 1: Create ScheduleCountdown**

Create `components/landing/ScheduleCountdown.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { computeTimeLeft, getTargetDate, type TimeLeft } from "@/lib/utils/countdown";
import type { PublicTournament } from "@/features/admin/queries";

interface Props {
  tournament: PublicTournament;
}

const pad = (n: number) => String(n).padStart(2, "0");

const ScheduleCountdown = ({ tournament }: Props) => {
  const target = useMemo(
    () => getTargetDate(tournament.start_date, tournament.start_time),
    [tournament.start_date, tournament.start_time]
  );
  // null = not yet computed; TimeLeft = counting down; "past" = tournament started
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null | "past">(null);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      const result = computeTimeLeft(target);
      setTimeLeft(result === null ? "past" : result);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [target]);

  if (timeLeft === null) return null; // not yet hydrated

  if (timeLeft === "past") {
    return (
      <p className="animate-pulse text-sm font-bold uppercase tracking-widest text-[#F5C400]">
        Sedang Berlangsung
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
        Countdown — {tournament.name}
      </p>
      <div className="flex items-baseline gap-1 font-black tabular-nums text-white" style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.02em", lineHeight: 1 }}>
        <span>{pad(timeLeft.days)}</span>
        <span className="text-[#F5C400]" style={{ opacity: 0.6 }}>·</span>
        <span>{pad(timeLeft.hours)}</span>
        <span className="text-[#F5C400]" style={{ opacity: 0.6 }}>·</span>
        <span>{pad(timeLeft.minutes)}</span>
        <span className="text-[#F5C400]" style={{ opacity: 0.6 }}>·</span>
        <span>{pad(timeLeft.seconds)}</span>
      </div>
      <div className="mt-1 flex items-center gap-6">
        {["Hari", "Jam", "Menit", "Detik"].map((label) => (
          <span key={label} className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/25">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};
export { ScheduleCountdown };
```

- [ ] **Step 3: Run CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/ScheduleCountdown.tsx
git commit -m "feat(schedule): add ScheduleCountdown client component"
```

---

## Task 6: /schedule Page

**Files:**
- Create: `app/schedule/page.tsx`

- [ ] **Step 1: Create the /schedule page**

Create `app/schedule/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import dynamic from "next/dynamic";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getScheduleTournaments } from "@/features/admin/queries";
import type { PublicTournament } from "@/features/admin/queries";

const ScheduleCountdown = dynamic(
  () => import("@/components/landing/ScheduleCountdown").then((m) => ({ default: m.ScheduleCountdown })),
  { ssr: false }
);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule — Hyperion Team",
  description: "Jadwal turnamen mendatang Hyperion Team.",
};

function groupByMonth(tournaments: PublicTournament[]): Map<string, PublicTournament[]> {
  const map = new Map<string, PublicTournament[]>();
  for (const t of tournaments) {
    const key = t.start_date.slice(0, 7); // "YYYY-MM"
    const group = map.get(key) ?? [];
    group.push(t);
    map.set(key, group);
  }
  return map;
}

function formatMonthHeader(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" }).toUpperCase();
}

function formatDate(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr + "T00:00:00");
  const d = date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  return timeStr ? `${d} · ${timeStr.slice(0, 5)}` : d;
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "UPCOMING",
  ongoing: "ONGOING",
  completed: "SELESAI",
};

const STATUS_COLOR: Record<string, string> = {
  upcoming: "text-[#F5C400] border-[#F5C400]/30 bg-[#F5C400]/10",
  ongoing: "text-green-400 border-green-400/30 bg-green-400/10",
  completed: "text-white/30 border-white/10 bg-white/5",
};

export default async function SchedulePage() {
  const tournaments = await getScheduleTournaments();
  const nearest = tournaments[0] ?? null;
  const grouped = groupByMonth(tournaments);

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                Hyperion Team
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Schedule
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/55">
              Jadwal turnamen mendatang Hyperion Team.
            </p>

            {nearest && (
              <div className="mt-10">
                <ScheduleCountdown tournament={nearest} />
              </div>
            )}
          </div>
        </section>

        {/* Tournament list */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {tournaments.length === 0 ? (
              <div className="border border-white/12 bg-[#071428] py-20 text-center">
                <CalendarRange className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/45">Belum ada jadwal turnamen yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {Array.from(grouped.entries()).map(([monthKey, items]) => (
                  <div key={monthKey}>
                    <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.4em] text-white/40">
                      {formatMonthHeader(monthKey)}
                    </h2>
                    <div className="divide-y divide-white/8 border border-white/12">
                      {items.map((t) => (
                        <div
                          key={t.id}
                          className="flex flex-col gap-3 bg-[#071428] px-5 py-5 sm:flex-row sm:items-center sm:gap-6"
                        >
                          {/* Date */}
                          <div className="w-full shrink-0 sm:w-52">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5C400]">
                              {formatDate(t.start_date, t.start_time)}
                            </p>
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="font-black uppercase tracking-tight text-white sm:text-lg">
                              {t.name}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                              {t.game && <span>{t.game}</span>}
                              {t.game && t.division_name && <span>·</span>}
                              {t.division_name && <span>{t.division_name}</span>}
                              {t.organizer && <><span>·</span><span>{t.organizer}</span></>}
                              {t.prize_pool && <><span>·</span><span className="text-[#F5C400]/70">{t.prize_pool}</span></>}
                            </div>
                          </div>

                          {/* Right side: status + register */}
                          <div className="flex shrink-0 items-center gap-3">
                            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[t.status] ?? STATUS_COLOR.upcoming}`}>
                              {STATUS_LABEL[t.status] ?? t.status.toUpperCase()}
                            </span>
                            {t.registration_url && (
                              <Link
                                href={t.registration_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border border-[#F5C400] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
                              >
                                Daftar →
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Run CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```

- [ ] **Step 3: Commit**

```bash
git add app/schedule/page.tsx
git commit -m "feat(schedule): add public /schedule page with countdown + grouped list"
```

---

## Task 7: UpcomingMatchesSection Component

**Files:**
- Create: `components/landing/UpcomingMatchesSection.tsx`

- [ ] **Step 1: Create UpcomingMatchesSection**

Create `components/landing/UpcomingMatchesSection.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import type { PublicTournament } from "@/features/admin/queries";

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
    <section className="bg-[#040D1C] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/12 pb-8"
        >
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
              05 — Schedule
            </p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
              Upcoming Matches
            </h2>
          </div>
          <Link
            href="/schedule"
            className="text-[11px] font-bold uppercase tracking-widest text-[#F5C400] transition hover:text-[#F5C400]/70"
          >
            View schedule page →
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
              className="group flex flex-col gap-3 border border-white/10 bg-[#071428] p-5 transition-all duration-200 hover:border-[#F5C400]/40 hover:bg-[#0C1E3C]"
            >
              {/* Date + game badge */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#F5C400]">
                  {formatCardDate(t.start_date, t.start_time)}
                </p>
                {t.game && (
                  <span className="shrink-0 rounded bg-[#F5C400]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F5C400]">
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

- [ ] **Step 2: Run CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/UpcomingMatchesSection.tsx
git commit -m "feat(schedule): add UpcomingMatchesSection home component"
```

---

## Task 8: Home Page + Nav Update

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/landing/Header.tsx`

- [ ] **Step 1: Update Header DEFAULT_NAV**

In `components/landing/Header.tsx`, find `DEFAULT_NAV` and add Schedule:

```ts
const DEFAULT_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Achievement", href: "/gallery" },
  { label: "Division", href: "/divisions" },
  { label: "Schedule", href: "/schedule" },
  { label: "Rekrutmen", href: "/rekrutmen" },
];
```

- [ ] **Step 2: Update app/page.tsx — imports**

Add these three imports to `app/page.tsx` (near the existing feature imports):

```ts
import {
  getGalleryEntries,
  getPublicAchievements,
  getActivePartners,
  getActiveTestimonials,
  getSiteSettings,
  getFeaturedTournaments,
  getUpcomingPublicTournaments,
  getNearestPublicTournament,
} from "@/features/admin/queries";
import { UpcomingMatchesSection } from "@/components/landing/UpcomingMatchesSection";
```

- [ ] **Step 3: Update app/page.tsx — data fetching**

Find the `Promise.all` block and add the two new queries:

```ts
const [galleryEntries, manualAchievements, partners, testimonials, settings, featuredTournaments, upcomingMatches, nearestTournament] =
  await Promise.all([
    getGalleryEntries(),
    getPublicAchievements(),
    getActivePartners(),
    getActiveTestimonials(),
    getSiteSettings(),
    getFeaturedTournaments(),
    getUpcomingPublicTournaments(3),
    getNearestPublicTournament(),
  ]);
```

- [ ] **Step 4: Update app/page.tsx — hero countdown source**

Find where `featuredTournaments` is passed to `HeroSection` and update it to prefer the nearest public tournament:

```ts
// After the Promise.all, before the return:
const heroTournaments = nearestTournament
  ? [{ id: nearestTournament.id, name: nearestTournament.name, start_date: nearestTournament.start_date, start_time: nearestTournament.start_time }]
  : featuredTournaments;
```

Then in the JSX, change `featuredTournaments={featuredTournaments}` to `featuredTournaments={heroTournaments}`.

- [ ] **Step 5: Update app/page.tsx — add UpcomingMatchesSection**

In the JSX return, add `<UpcomingMatchesSection>` directly after `<HeroSection>` and before `<DivisionsSection>`:

```tsx
return (
  <>
    <Header />
    <main className="flex-1">
      <HeroSection
        slides={heroSlides}
        settings={heroSettings}
        featuredTournaments={heroTournaments}
        heroBackground={settings.hero_background_url || null}
      />
      <UpcomingMatchesSection tournaments={upcomingMatches} />
      <DivisionsSection />
      <AchievementsSection entries={mergedAchievements} />
      <TestimonialsSection testimonials={testimonials} />
      <PartnersSection partners={partners} />
      <JoinUsSection settings={joinSettings} />
    </main>
    <Footer settings={footerSettings} />
  </>
);
```

- [ ] **Step 6: Run CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx components/landing/Header.tsx
git commit -m "feat(schedule): wire home page — upcoming matches section + hero countdown from show_on_schedule"
```

---

## Task 9: Visual Verification

- [ ] **Step 1: Toggle a tournament as public in admin panel**

Navigate to `/admin/tournaments` (or the admin dashboard tournaments section). Click "Publik" on at least one tournament with a future `start_date`. Verify the button turns yellow with "Publik ✓".

- [ ] **Step 2: Verify /schedule page**

Navigate to `http://localhost:3000/schedule`:
- [ ] Page loads with navy background
- [ ] Countdown shows for the nearest public tournament (numbers updating every second)
- [ ] Tournament list shows below, grouped by month
- [ ] Status badge visible

- [ ] **Step 3: Verify home page upcoming section**

Navigate to `http://localhost:3000`:
- [ ] "Upcoming Matches" section visible between Hero and Divisions
- [ ] 3 tournament cards (or fewer if less than 3 public)
- [ ] "View schedule page →" link works
- [ ] Hero countdown shows for nearest public tournament

- [ ] **Step 4: Verify Schedule in nav**

Check that "Schedule" appears in the desktop nav bar and mobile drawer. Click it → goes to `/schedule`.

- [ ] **Step 5: Toggle off and verify disappears**

Turn off "Publik" for the tournament. Reload `/schedule` and home — tournament should be gone from both surfaces.

- [ ] **Step 6: Final commit if any small fixes**

```bash
git add <changed-files>
git commit -m "fix(schedule): visual verification fixes"
```
