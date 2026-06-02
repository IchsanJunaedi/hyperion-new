# Public Rekrutmen Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/rekrutmen` page that auto-lists all active open trials so outsiders can discover and apply without needing a direct link.

**Architecture:** One new query in the existing trials module fetches all `open_trials` with `status="active"`. A new server-component page renders them as cards linking to the existing `/trial/[token]` application form. A nav link is added to the header so the page is discoverable.

**Tech Stack:** Next.js 15 App Router (Server Components), Supabase admin client, TypeScript strict, Tailwind CSS v4, Lucide React, existing Header/Footer components.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `features/trials/queries.ts` | Edit | Add `PublicTrial` type + `getActivePublicTrials()` query |
| `features/trials/__tests__/public-trials.test.ts` | Create | Unit test for the new query |
| `app/rekrutmen/page.tsx` | Create | Public listing page |
| `components/landing/HeaderClient.tsx` | Edit | Add "Rekrutmen" to nav links |

---

### Task 1: `getActivePublicTrials` query + test

**Files:**
- Modify: `features/trials/queries.ts`
- Create: `features/trials/__tests__/public-trials.test.ts`

- [ ] **Step 1: Write the failing test**

Create `features/trials/__tests__/public-trials.test.ts`:

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActivePublicTrials } from "../queries";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin");

const mockLimit = vi.fn();
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createAdminClient).mockReturnValue({
    from: vi.fn().mockReturnValue({ select: mockSelect }),
  } as any);
});

describe("getActivePublicTrials", () => {
  it("returns empty array on DB error", async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: "db error" } });
    const result = await getActivePublicTrials();
    expect(result).toEqual([]);
  });

  it("queries only active trials", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });
    await getActivePublicTrials();
    expect(mockEq).toHaveBeenCalledWith("status", "active");
  });

  it("returns mapped trials with org data", async () => {
    const raw = [
      {
        id: "t1",
        org_id: "o1",
        title: "Trial MLBB",
        game: "Mobile Legends",
        positions: ["Tank", "Marksman"],
        status: "active",
        public_token: "abc123",
        division_id: null,
        created_by: null,
        created_at: "2026-06-01",
        updated_at: "2026-06-01",
        organizations: { name: "Hyperion Red", slug: "hyperion-red", logo_url: null },
      },
    ];
    mockLimit.mockResolvedValue({ data: raw, error: null });
    const result = await getActivePublicTrials();
    expect(result).toHaveLength(1);
    expect(result[0].org_name).toBe("Hyperion Red");
    expect(result[0].org_slug).toBe("hyperion-red");
    expect(result[0].public_token).toBe("abc123");
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx vitest run features/trials/__tests__/public-trials.test.ts
```
Expected: FAIL — `getActivePublicTrials` not exported.

- [ ] **Step 3: Add `PublicTrial` type and `getActivePublicTrials` to `features/trials/queries.ts`**

Add at the bottom of `features/trials/queries.ts`:

```ts
export interface PublicTrial extends TrialRow {
  org_name: string;
  org_slug: string;
  org_logo_url: string | null;
}

export async function getActivePublicTrials(): Promise<PublicTrial[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("open_trials")
    .select("*, organizations(name, slug, logo_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("getActivePublicTrials:", error);
  if (!data) return [];
  return data.map((row) => {
    const org = (row as any).organizations as { name: string; slug: string; logo_url: string | null } | null;
    return {
      ...(row as unknown as TrialRow),
      org_name: org?.name ?? "Tim",
      org_slug: org?.slug ?? "",
      org_logo_url: org?.logo_url ?? null,
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run features/trials/__tests__/public-trials.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Run full CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
rtk git add features/trials/queries.ts features/trials/__tests__/public-trials.test.ts
rtk git commit -m "feat(rekrutmen): add getActivePublicTrials query"
```

---

### Task 2: `/rekrutmen` public page

**Files:**
- Create: `app/rekrutmen/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link";
import Image from "next/image";
import { Gamepad2 } from "lucide-react";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getActivePublicTrials } from "@/features/trials/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Rekrutmen Terbuka — Hyperion Team",
    description: "Lihat posisi yang sedang dibuka dan daftar jadi bagian dari Hyperion Team.",
  };
}

export default async function RekrutmenPage() {
  const trials = await getActivePublicTrials();

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#070707]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 px-6 py-20 sm:px-10 lg:px-16">
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
                Open Recruitment
              </span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              REKRUTMEN
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/40 sm:text-base">
              Posisi yang sedang dibuka oleh Hyperion Team. Daftar sekarang dan tunjukkan kemampuanmu.
            </p>
          </div>
        </section>

        {/* Trial cards */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {trials.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trials.map((trial) => (
                  <div
                    key={trial.id}
                    className="flex flex-col gap-5 border border-white/5 bg-[#0D0D0D] p-6"
                  >
                    {/* Org header */}
                    <div className="flex items-center gap-3">
                      {trial.org_logo_url ? (
                        <Image
                          src={trial.org_logo_url}
                          alt={trial.org_name}
                          width={36}
                          height={36}
                          className="h-9 w-9 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#1E1E1E] text-xs font-black text-white/30">
                          {trial.org_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate text-xs font-semibold uppercase tracking-wider text-white/40">
                        {trial.org_name}
                      </span>
                    </div>

                    {/* Trial info */}
                    <div className="flex-1">
                      <h2 className="text-base font-black uppercase tracking-tight text-white">
                        {trial.title}
                      </h2>

                      {/* Game */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <Gamepad2 className="h-3 w-3 text-white/25" />
                        <span className="text-[11px] text-white/40">{trial.game}</span>
                      </div>

                      {/* Positions */}
                      {trial.positions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {trial.positions.map((pos) => (
                            <span
                              key={pos}
                              className="rounded border border-[#F5C400]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F5C400]"
                            >
                              {pos}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/trial/${trial.public_token}`}
                      className="flex items-center justify-center border border-[#F5C400] py-2.5 text-xs font-black uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
                    >
                      Daftar Sekarang
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-white/5 bg-[#0D0D0D] py-24 text-center">
                <Gamepad2 className="mx-auto mb-4 h-8 w-8 text-white/10" />
                <p className="text-sm font-semibold text-white/30">
                  Tidak ada rekrutmen terbuka saat ini.
                </p>
                <p className="mt-2 text-xs text-white/20">Pantau terus — posisi baru akan diumumkan di sini.</p>
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

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
rtk git add app/rekrutmen/page.tsx
rtk git commit -m "feat(rekrutmen): add public recruitment listing page"
```

---

### Task 3: Add "Rekrutmen" to header nav

**Files:**
- Modify: `components/landing/HeaderClient.tsx`

- [ ] **Step 1: Find and update `NAV_LINKS` in `components/landing/HeaderClient.tsx`**

Find this array (around line 19):
```ts
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/divisions", label: "Division" },
] as const;
```

Replace with:
```ts
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/divisions", label: "Division" },
  { href: "/rekrutmen", label: "Rekrutmen" },
] as const;
```

- [ ] **Step 2: Run full CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: all pass.

- [ ] **Step 3: Commit and push**

```bash
rtk git add components/landing/HeaderClient.tsx
rtk git commit -m "feat(rekrutmen): add Rekrutmen link to public nav"
rtk git push origin main
```

---

## Done Checklist

- [ ] `getActivePublicTrials` query tested and working
- [ ] `/rekrutmen` page renders trial cards with org name, title, game, positions
- [ ] "Daftar Sekarang" links to existing `/trial/[token]` form
- [ ] Empty state when no active trials
- [ ] "Rekrutmen" link in header nav
- [ ] All CI checks pass: lint + typecheck + test:unit
