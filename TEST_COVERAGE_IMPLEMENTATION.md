# Test Coverage 10% Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Naik dari 0.38% → 10% code coverage dengan 8 test files yang fokus pada logika bisnis murni (pure functions + Zod schema boundary testing).

**Architecture:** Semua test ditulis dengan TDD — tulis test dulu, pastikan fail, baru implementasi (atau konfirmasi kode sudah ada). Semua target adalah pure functions tanpa Supabase/network calls — global mock di `__tests__/setup.ts` sudah cukup.

**Tech Stack:** Vitest v3, `@testing-library/jest-dom`, jsdom. Run tests: `rtk vitest run --coverage`. Check coverage: `rtk vitest run --coverage 2>&1 | grep -E "All files|features|lib"`.

---

## File Map

| File yang Dibuat | Sumber yang Di-test |
|---|---|
| `lib/utils/__tests__/slug.test.ts` | `lib/utils/slug.ts` |
| `lib/utils/__tests__/format.test.ts` | `lib/utils/format.ts` |
| `lib/utils/__tests__/wa-templates.test.ts` | `lib/utils/wa-templates.ts` |
| `lib/validations/__tests__/shared.test.ts` | `lib/validations/shared.ts` |
| `lib/validations/__tests__/finance.test.ts` | `lib/validations/finance.ts` |
| `lib/validations/__tests__/scrim.test.ts` | `lib/validations/scrim.ts` |
| `lib/validations/__tests__/calendar.test.ts` | `lib/validations/calendar.ts` |
| `lib/permissions/__tests__/calendar-rules.test.ts` | `lib/permissions/calendar-rules.ts` |
| `features/finances/__tests__/queries.test.ts` | `features/finances/queries.ts` (expand) |
| `features/scrim/__tests__/queries.test.ts` | `features/scrim/queries.ts` (summarizeAttendance) |

---

## Task 1: lib/utils slug tests

**Files:**
- Create: `lib/utils/__tests__/slug.test.ts`

- [ ] **Step 1: Buat direktori dan tulis test file**

```typescript
// lib/utils/__tests__/slug.test.ts
import { describe, it, expect } from "vitest";
import { slugify, isValidSlug } from "@/lib/utils/slug";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("strips diacritics", () => {
    expect(slugify("Héllo Wörld")).toBe("hello-world");
  });
  it("replaces underscores with dashes", () => {
    expect(slugify("hello_world")).toBe("hello-world");
  });
  it("removes special characters", () => {
    expect(slugify("hello@world!")).toBe("helloworld");
  });
  it("collapses repeated dashes", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });
  it("trims leading and trailing dashes", () => {
    expect(slugify("-hello-")).toBe("hello");
  });
  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
  it("handles already-valid slug", () => {
    expect(slugify("hello-world")).toBe("hello-world");
  });
  it("handles Indonesian team name with numbers", () => {
    expect(slugify("Tim Garuda 2024")).toBe("tim-garuda-2024");
  });
});

describe("isValidSlug", () => {
  it("accepts valid 3-char slug", () => {
    expect(isValidSlug("abc")).toBe(true);
  });
  it("accepts valid slug with dashes", () => {
    expect(isValidSlug("hello-world")).toBe(true);
  });
  it("accepts 32-char slug", () => {
    expect(isValidSlug("a" + "b".repeat(30) + "c")).toBe(true);
  });
  it("rejects 2-char slug (too short)", () => {
    expect(isValidSlug("ab")).toBe(false);
  });
  it("rejects slug starting with dash", () => {
    expect(isValidSlug("-hello")).toBe(false);
  });
  it("rejects slug ending with dash", () => {
    expect(isValidSlug("hello-")).toBe(false);
  });
  it("rejects uppercase", () => {
    expect(isValidSlug("Hello")).toBe(false);
  });
  it("rejects 33-char slug (too long)", () => {
    expect(isValidSlug("a" + "b".repeat(31) + "c")).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan test untuk memastikan semua pass**

```bash
rtk vitest run lib/utils/__tests__/slug.test.ts
```

Expected output: `✓ lib/utils/__tests__/slug.test.ts (17 tests)`

- [ ] **Step 3: Commit**

```bash
rtk git add lib/utils/__tests__/slug.test.ts && rtk git commit -m "test: add slug utility unit tests"
```

---

## Task 2: lib/utils format tests

**Files:**
- Create: `lib/utils/__tests__/format.test.ts`

- [ ] **Step 1: Tulis test file**

```typescript
// lib/utils/__tests__/format.test.ts
import { describe, it, expect } from "vitest";
import {
  normalizeWaNumber,
  formatDateTime,
  formatScrimSchedule,
} from "@/lib/utils/format";

describe("normalizeWaNumber", () => {
  it("converts 08xx to 628xx", () => {
    expect(normalizeWaNumber("081234567890")).toBe("6281234567890");
  });
  it("keeps 628xx unchanged", () => {
    expect(normalizeWaNumber("6281234567890")).toBe("6281234567890");
  });
  it("converts 8xx to 628xx", () => {
    expect(normalizeWaNumber("81234567890")).toBe("6281234567890");
  });
  it("strips non-digit chars before converting", () => {
    expect(normalizeWaNumber("0812-3456-7890")).toBe("6281234567890");
  });
  it("returns other numbers unchanged (no 0/62/8 prefix)", () => {
    expect(normalizeWaNumber("1234567890")).toBe("1234567890");
  });
});

describe("formatDateTime", () => {
  it("formats an ISO string and contains year and separator", () => {
    const result = formatDateTime("2026-05-18T13:00:00.000Z");
    expect(result).toContain("2026");
    expect(result).toContain("·");
  });
  it("formats a Date object", () => {
    const d = new Date("2026-12-25T10:00:00.000Z");
    const result = formatDateTime(d);
    expect(result).toContain("2026");
    expect(result).toContain("·");
  });
});

describe("formatScrimSchedule", () => {
  it("returns 'Hari ini' prefix for today", () => {
    const today = new Date();
    today.setHours(20, 0, 0, 0);
    expect(formatScrimSchedule(today).startsWith("Hari ini")).toBe(true);
  });
  it("returns 'Besok' prefix for tomorrow", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);
    expect(formatScrimSchedule(tomorrow).startsWith("Besok")).toBe(true);
  });
  it("returns date string with separator for other days", () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const result = formatScrimSchedule(nextWeek);
    expect(result).not.toContain("Hari ini");
    expect(result).not.toContain("Besok");
    expect(result).toContain("·");
  });
  it("accepts ISO string input", () => {
    const futureIso = new Date(Date.now() + 14 * 86400000).toISOString();
    const result = formatScrimSchedule(futureIso);
    expect(result).toContain("·");
  });
});
```

- [ ] **Step 2: Jalankan test**

```bash
rtk vitest run lib/utils/__tests__/format.test.ts
```

Expected output: `✓ lib/utils/__tests__/format.test.ts (13 tests)`

- [ ] **Step 3: Commit**

```bash
rtk git add lib/utils/__tests__/format.test.ts && rtk git commit -m "test: add format utility unit tests"
```

---

## Task 3: lib/utils wa-templates tests

**Files:**
- Create: `lib/utils/__tests__/wa-templates.test.ts`

- [ ] **Step 1: Tulis test file**

```typescript
// lib/utils/__tests__/wa-templates.test.ts
import { describe, it, expect } from "vitest";
import {
  buildScrimWaMessage,
  buildTournamentWaMessage,
} from "@/lib/utils/wa-templates";

describe("buildScrimWaMessage", () => {
  const base = {
    orgName: "Tim Garuda",
    opponentName: "Tim Elang",
    scheduledAt: "2026-05-20T13:00:00.000Z",
    format: "bo3",
    scrimUrl: "https://hyperionteam.id/garuda/scrim/123",
  };

  it("contains org name, opponent, and scrim URL", () => {
    const msg = buildScrimWaMessage(base);
    expect(msg).toContain("Tim Garuda");
    expect(msg).toContain("Tim Elang");
    expect(msg).toContain("https://hyperionteam.id/garuda/scrim/123");
  });

  it("uppercases the format value", () => {
    const msg = buildScrimWaMessage(base);
    expect(msg).toContain("BO3");
  });

  it("omits Region, Room, Catatan lines when not provided", () => {
    const msg = buildScrimWaMessage(base);
    expect(msg).not.toContain("Region:");
    expect(msg).not.toContain("Room:");
    expect(msg).not.toContain("Catatan:");
  });

  it("includes optional fields when provided", () => {
    const msg = buildScrimWaMessage({
      ...base,
      serverRegion: "SEA",
      roomInfo: "Room 101 / Pass: 1234",
      notes: "Pakai server cadangan",
    });
    expect(msg).toContain("SEA");
    expect(msg).toContain("Room 101 / Pass: 1234");
    expect(msg).toContain("Pakai server cadangan");
  });

  it("includes confirmation URL line", () => {
    const msg = buildScrimWaMessage(base);
    expect(msg).toContain("Konfirmasi kehadiran");
  });
});

describe("buildTournamentWaMessage", () => {
  const base = {
    orgName: "Tim Garuda",
    tournamentName: "MPL Season 15",
    startDate: "2026-06-01",
    tournamentUrl: "https://hyperionteam.id/garuda/tournament/456",
  };

  it("contains tournament name and URL", () => {
    const msg = buildTournamentWaMessage(base);
    expect(msg).toContain("MPL Season 15");
    expect(msg).toContain("https://hyperionteam.id/garuda/tournament/456");
  });

  it("omits optional fields when not provided", () => {
    const msg = buildTournamentWaMessage(base);
    expect(msg).not.toContain("Organizer:");
    expect(msg).not.toContain("Selesai:");
    expect(msg).not.toContain("Prize Pool:");
    expect(msg).not.toContain("Biaya Daftar:");
    expect(msg).not.toContain("Link registrasi:");
  });

  it("includes all optional fields when provided", () => {
    const msg = buildTournamentWaMessage({
      ...base,
      organizer: "Moonton",
      endDate: "2026-06-10",
      prizePool: "Rp 10.000.000",
      registrationFee: "Rp 150.000",
      registrationUrl: "https://moonton.com/register",
    });
    expect(msg).toContain("Moonton");
    expect(msg).toContain("Rp 10.000.000");
    expect(msg).toContain("Rp 150.000");
    expect(msg).toContain("https://moonton.com/register");
  });
});
```

- [ ] **Step 2: Jalankan test**

```bash
rtk vitest run lib/utils/__tests__/wa-templates.test.ts
```

Expected output: `✓ lib/utils/__tests__/wa-templates.test.ts (11 tests)`

- [ ] **Step 3: Commit**

```bash
rtk git add lib/utils/__tests__/wa-templates.test.ts && rtk git commit -m "test: add WA template builder unit tests"
```

---

## Task 4: lib/validations shared tests

**Files:**
- Create: `lib/validations/__tests__/shared.test.ts`

- [ ] **Step 1: Tulis test file**

```typescript
// lib/validations/__tests__/shared.test.ts
import { describe, it, expect } from "vitest";
import {
  waNumberSchema,
  passwordSchema,
  emailSchema,
  slugSchema,
} from "@/lib/validations/shared";

describe("waNumberSchema", () => {
  it("converts +6281234567890 to 6281234567890", () => {
    const r = waNumberSchema.safeParse("+6281234567890");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("6281234567890");
  });
  it("converts 081234567890 to 6281234567890", () => {
    const r = waNumberSchema.safeParse("081234567890");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("6281234567890");
  });
  it("keeps 6281234567890 unchanged", () => {
    const r = waNumberSchema.safeParse("6281234567890");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("6281234567890");
  });
  it("rejects number shorter than 8 digits", () => {
    expect(waNumberSchema.safeParse("0812").success).toBe(false);
  });
  it("rejects number with letters", () => {
    expect(waNumberSchema.safeParse("0812abc4567").success).toBe(false);
  });
  it("rejects number longer than 20 chars", () => {
    expect(waNumberSchema.safeParse("0" + "8".repeat(21)).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts valid password with uppercase, number, special char", () => {
    expect(passwordSchema.safeParse("SecurePass1!").success).toBe(true);
  });
  it("rejects password without uppercase letter", () => {
    const r = passwordSchema.safeParse("securepass1!");
    expect(r.success).toBe(false);
  });
  it("rejects password without number", () => {
    const r = passwordSchema.safeParse("SecurePass!!");
    expect(r.success).toBe(false);
  });
  it("rejects password without special char (. ! @ #)", () => {
    const r = passwordSchema.safeParse("SecurePass1A");
    expect(r.success).toBe(false);
  });
  it("rejects password shorter than 8 chars", () => {
    const r = passwordSchema.safeParse("Se1!");
    expect(r.success).toBe(false);
  });
  it("rejects password longer than 72 chars", () => {
    const r = passwordSchema.safeParse("A1!" + "a".repeat(71));
    expect(r.success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("accepts valid email and normalizes to lowercase", () => {
    const r = emailSchema.safeParse("User@Example.COM");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("user@example.com");
  });
  it("rejects string without @", () => {
    expect(emailSchema.safeParse("notanemail").success).toBe(false);
  });
  it("rejects string without domain", () => {
    expect(emailSchema.safeParse("user@").success).toBe(false);
  });
});

describe("slugSchema", () => {
  it("accepts valid kebab-case slug", () => {
    expect(slugSchema.safeParse("tim-garuda-2024").success).toBe(true);
  });
  it("rejects slug with uppercase letters", () => {
    expect(slugSchema.safeParse("Tim-Garuda").success).toBe(false);
  });
  it("rejects slug starting with dash", () => {
    expect(slugSchema.safeParse("-tim-garuda").success).toBe(false);
  });
  it("rejects slug ending with dash", () => {
    expect(slugSchema.safeParse("tim-garuda-").success).toBe(false);
  });
  it("rejects slug shorter than 3 chars", () => {
    expect(slugSchema.safeParse("ab").success).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan test**

```bash
rtk vitest run lib/validations/__tests__/shared.test.ts
```

Expected output: `✓ lib/validations/__tests__/shared.test.ts (19 tests)`

- [ ] **Step 3: Commit**

```bash
rtk git add lib/validations/__tests__/shared.test.ts && rtk git commit -m "test: add shared validations unit tests (waNumber, password, email, slug)"
```

---

## Task 5: lib/validations finance tests

**Files:**
- Create: `lib/validations/__tests__/finance.test.ts`

- [ ] **Step 1: Tulis test file**

```typescript
// lib/validations/__tests__/finance.test.ts
import { describe, it, expect } from "vitest";
import { createFinanceSchema } from "@/lib/validations/finance";

describe("createFinanceSchema", () => {
  const valid = {
    type: "income" as const,
    amount: 500000,
    category: "Iuran Member",
    date: "2026-05-01",
  };

  it("accepts valid income entry", () => {
    expect(createFinanceSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts valid expense entry", () => {
    expect(createFinanceSchema.safeParse({ ...valid, type: "expense" }).success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(createFinanceSchema.safeParse({ ...valid, type: "transfer" }).success).toBe(false);
  });

  it("rejects amount of 0 (must be positive)", () => {
    expect(createFinanceSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(createFinanceSchema.safeParse({ ...valid, amount: -100 }).success).toBe(false);
  });

  it("rejects float amount (must be integer)", () => {
    expect(createFinanceSchema.safeParse({ ...valid, amount: 100.5 }).success).toBe(false);
  });

  it("rejects empty category", () => {
    expect(createFinanceSchema.safeParse({ ...valid, category: "" }).success).toBe(false);
  });

  it("rejects invalid date string", () => {
    expect(createFinanceSchema.safeParse({ ...valid, date: "bukan-tanggal" }).success).toBe(false);
  });

  it("transforms empty description to null", () => {
    const r = createFinanceSchema.safeParse({ ...valid, description: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.description).toBeNull();
  });

  it("keeps non-empty description", () => {
    const r = createFinanceSchema.safeParse({ ...valid, description: "Iuran Mei" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.description).toBe("Iuran Mei");
  });

  it("coerces string amount to number", () => {
    const r = createFinanceSchema.safeParse({ ...valid, amount: "250000" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.amount).toBe(250000);
  });
});
```

- [ ] **Step 2: Jalankan test**

```bash
rtk vitest run lib/validations/__tests__/finance.test.ts
```

Expected output: `✓ lib/validations/__tests__/finance.test.ts (11 tests)`

- [ ] **Step 3: Commit**

```bash
rtk git add lib/validations/__tests__/finance.test.ts && rtk git commit -m "test: add finance schema validation unit tests"
```

---

## Task 6: lib/validations scrim tests

**Files:**
- Create: `lib/validations/__tests__/scrim.test.ts`

- [ ] **Step 1: Tulis test file**

```typescript
// lib/validations/__tests__/scrim.test.ts
import { describe, it, expect } from "vitest";
import {
  matchFormatSchema,
  createScrimSchema,
  submitResultSchema,
  updateAttendanceSchema,
} from "@/lib/validations/scrim";

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const FUTURE_ISO = new Date(Date.now() + 86400000).toISOString(); // tomorrow

describe("matchFormatSchema", () => {
  it.each(["bo1", "bo2", "bo3", "bo5", "bo7", "4match"])(
    "accepts valid format: %s",
    (format) => {
      expect(matchFormatSchema.safeParse(format).success).toBe(true);
    },
  );
  it("rejects 'scrimmage' (removed format)", () => {
    expect(matchFormatSchema.safeParse("scrimmage").success).toBe(false);
  });
  it("rejects unknown format 'bo4'", () => {
    expect(matchFormatSchema.safeParse("bo4").success).toBe(false);
  });
});

describe("createScrimSchema", () => {
  const valid = {
    division_id: VALID_UUID,
    opponent_name: "Tim Elang",
    scheduled_at: FUTURE_ISO,
    format: "bo3",
  };

  it("accepts valid minimal input", () => {
    expect(createScrimSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty opponent_name", () => {
    expect(createScrimSchema.safeParse({ ...valid, opponent_name: "" }).success).toBe(false);
  });

  it("rejects opponent_name longer than 120 chars", () => {
    expect(
      createScrimSchema.safeParse({ ...valid, opponent_name: "a".repeat(121) }).success,
    ).toBe(false);
  });

  it("rejects non-UUID division_id", () => {
    expect(createScrimSchema.safeParse({ ...valid, division_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects non-date scheduled_at", () => {
    expect(createScrimSchema.safeParse({ ...valid, scheduled_at: "bukan-iso" }).success).toBe(false);
  });

  it("transforms empty server_region to null", () => {
    const r = createScrimSchema.safeParse({ ...valid, server_region: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.server_region).toBeNull();
  });

  it("transforms empty room_info to null", () => {
    const r = createScrimSchema.safeParse({ ...valid, room_info: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.room_info).toBeNull();
  });

  it("keeps non-empty notes", () => {
    const r = createScrimSchema.safeParse({ ...valid, notes: "Pakai patch terbaru" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toBe("Pakai patch terbaru");
  });
});

describe("submitResultSchema", () => {
  const valid = {
    scrim_id: VALID_UUID,
    our_score: 2,
    opponent_score: 1,
    is_win: true,
  };

  it("accepts valid result", () => {
    expect(submitResultSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects our_score above 5", () => {
    expect(submitResultSchema.safeParse({ ...valid, our_score: 6 }).success).toBe(false);
  });

  it("rejects our_score below 0", () => {
    expect(submitResultSchema.safeParse({ ...valid, our_score: -1 }).success).toBe(false);
  });

  it("rejects performance_rating of 0 (min is 1)", () => {
    expect(submitResultSchema.safeParse({ ...valid, performance_rating: 0 }).success).toBe(false);
  });

  it("rejects performance_rating of 6 (max is 5)", () => {
    expect(submitResultSchema.safeParse({ ...valid, performance_rating: 6 }).success).toBe(false);
  });

  it("accepts performance_rating of 5", () => {
    expect(submitResultSchema.safeParse({ ...valid, performance_rating: 5 }).success).toBe(true);
  });

  it("accepts performance_rating of 1", () => {
    expect(submitResultSchema.safeParse({ ...valid, performance_rating: 1 }).success).toBe(true);
  });
});

describe("updateAttendanceSchema", () => {
  it.each(["confirmed", "declined", "tentative", "pending"])(
    "accepts valid status: %s",
    (status) => {
      const r = updateAttendanceSchema.safeParse({ scrim_id: VALID_UUID, status });
      expect(r.success).toBe(true);
    },
  );

  it("rejects invalid status 'maybe'", () => {
    expect(
      updateAttendanceSchema.safeParse({ scrim_id: VALID_UUID, status: "maybe" }).success,
    ).toBe(false);
  });

  it("transforms empty note to null", () => {
    const r = updateAttendanceSchema.safeParse({
      scrim_id: VALID_UUID,
      status: "confirmed",
      note: "",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.note).toBeNull();
  });
});
```

- [ ] **Step 2: Jalankan test**

```bash
rtk vitest run lib/validations/__tests__/scrim.test.ts
```

Expected output: `✓ lib/validations/__tests__/scrim.test.ts (21 tests)`

- [ ] **Step 3: Commit**

```bash
rtk git add lib/validations/__tests__/scrim.test.ts && rtk git commit -m "test: add scrim schema validation unit tests"
```

---

## Task 7: lib/validations calendar tests

**Files:**
- Create: `lib/validations/__tests__/calendar.test.ts`

> **Catatan:** `visibility` di schema calendar (`all`, `management`, `coach_up`, `private`) adalah event-level visibility — berbeda dari `CalendarVisibility` di `lib/permissions/calendar-types.ts`.

- [ ] **Step 1: Tulis test file**

```typescript
// lib/validations/__tests__/calendar.test.ts
import { describe, it, expect } from "vitest";
import {
  eventTypeSchema,
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from "@/lib/validations/calendar";

const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("eventTypeSchema", () => {
  it.each(["tournament", "practice", "meeting", "bootcamp", "other"])(
    "accepts valid event type: %s",
    (type) => {
      expect(eventTypeSchema.safeParse(type).success).toBe(true);
    },
  );

  it("rejects 'scrim' (not a valid calendar event type)", () => {
    expect(eventTypeSchema.safeParse("scrim").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(eventTypeSchema.safeParse("").success).toBe(false);
  });
});

describe("createCalendarEventSchema", () => {
  const valid = {
    title: "Latihan Rutin",
    event_type: "practice",
    starts_at: "2026-05-20T19:00:00.000Z",
    visibility: "all",
  };

  it("accepts minimal event (only starts_at, no ends_at)", () => {
    expect(createCalendarEventSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts event where ends_at > starts_at", () => {
    const r = createCalendarEventSchema.safeParse({
      ...valid,
      ends_at: "2026-05-20T21:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("accepts event where ends_at = starts_at (same time)", () => {
    const r = createCalendarEventSchema.safeParse({
      ...valid,
      ends_at: "2026-05-20T19:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("rejects event where ends_at < starts_at", () => {
    const r = createCalendarEventSchema.safeParse({
      ...valid,
      ends_at: "2026-05-20T18:00:00.000Z",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("ends_at"))).toBe(true);
    }
  });

  it("accepts ends_at = null (optional field)", () => {
    const r = createCalendarEventSchema.safeParse({ ...valid, ends_at: null });
    expect(r.success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(createCalendarEventSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });

  it("rejects title longer than 200 chars", () => {
    expect(
      createCalendarEventSchema.safeParse({ ...valid, title: "a".repeat(201) }).success,
    ).toBe(false);
  });

  it.each(["private", "management", "coach_up", "all"])(
    "accepts visibility level: %s",
    (visibility) => {
      expect(createCalendarEventSchema.safeParse({ ...valid, visibility }).success).toBe(true);
    },
  );

  it("rejects invalid visibility level", () => {
    expect(
      createCalendarEventSchema.safeParse({ ...valid, visibility: "public" }).success,
    ).toBe(false);
  });

  it("accepts valid division_id UUID", () => {
    const r = createCalendarEventSchema.safeParse({ ...valid, division_id: VALID_UUID });
    expect(r.success).toBe(true);
  });
});

describe("updateCalendarEventSchema", () => {
  const valid = { id: VALID_UUID };

  it("accepts partial update with only id", () => {
    expect(updateCalendarEventSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts update with only title", () => {
    const r = updateCalendarEventSchema.safeParse({ ...valid, title: "Judul Baru" });
    expect(r.success).toBe(true);
  });

  it("accepts update with starts_at only (no ends_at)", () => {
    const r = updateCalendarEventSchema.safeParse({
      ...valid,
      starts_at: "2026-05-20T19:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("rejects when both starts_at and ends_at given and ends_at < starts_at", () => {
    const r = updateCalendarEventSchema.safeParse({
      ...valid,
      starts_at: "2026-05-20T20:00:00.000Z",
      ends_at: "2026-05-20T18:00:00.000Z",
    });
    expect(r.success).toBe(false);
  });

  it("accepts when starts_at and ends_at given and ends_at > starts_at", () => {
    const r = updateCalendarEventSchema.safeParse({
      ...valid,
      starts_at: "2026-05-20T18:00:00.000Z",
      ends_at: "2026-05-20T20:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("rejects non-UUID id", () => {
    expect(updateCalendarEventSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan test**

```bash
rtk vitest run lib/validations/__tests__/calendar.test.ts
```

Expected output: `✓ lib/validations/__tests__/calendar.test.ts (23 tests)`

- [ ] **Step 3: Commit**

```bash
rtk git add lib/validations/__tests__/calendar.test.ts && rtk git commit -m "test: add calendar schema validation unit tests"
```

---

## Task 8: lib/permissions calendar-rules tests

**Files:**
- Create: `lib/permissions/__tests__/calendar-rules.test.ts`

> **Fungsi yang di-test** (semua pure, zero DB):
> - `resolvePermissions(role, visibility, explicitPerm?, isCreator)` → `Set<CalendarPermission>`
> - `isRoleHigherOrEqual(role, required)` → `boolean`
> - `canViewCalendar(perms)`, `canCreateEvents(perms)`, `canManageCalendar(perms)` → `boolean`

- [ ] **Step 1: Tulis test file**

```typescript
// lib/permissions/__tests__/calendar-rules.test.ts
import { describe, it, expect } from "vitest";
import {
  resolvePermissions,
  isRoleHigherOrEqual,
  canViewCalendar,
  canCreateEvents,
  canManageCalendar,
  canManagePermissions,
} from "@/lib/permissions/calendar-rules";

describe("resolvePermissions — owner", () => {
  it("has all permissions on public-workspace", () => {
    const perms = resolvePermissions("owner", "public-workspace");
    expect(canViewCalendar(perms)).toBe(true);
    expect(canCreateEvents(perms)).toBe(true);
    expect(canManageCalendar(perms)).toBe(true);
    expect(canManagePermissions(perms)).toBe(true);
  });

  it("has all permissions on private (owner overrides everything)", () => {
    const perms = resolvePermissions("owner", "private");
    expect(canViewCalendar(perms)).toBe(true);
    expect(canManageCalendar(perms)).toBe(true);
  });

  it("has all permissions on management-only", () => {
    const perms = resolvePermissions("owner", "management-only");
    expect(canViewCalendar(perms)).toBe(true);
    expect(canManageCalendar(perms)).toBe(true);
  });
});

describe("resolvePermissions — manager", () => {
  it("can view and create on public-workspace", () => {
    const perms = resolvePermissions("manager", "public-workspace");
    expect(canViewCalendar(perms)).toBe(true);
    expect(canCreateEvents(perms)).toBe(true);
  });

  it("cannot view private calendar (not creator)", () => {
    const perms = resolvePermissions("manager", "private", undefined, false);
    expect(canViewCalendar(perms)).toBe(false);
  });

  it("can view management-only calendar", () => {
    const perms = resolvePermissions("manager", "management-only");
    expect(canViewCalendar(perms)).toBe(true);
  });

  it("can manage management-only calendar", () => {
    const perms = resolvePermissions("manager", "management-only");
    expect(canManageCalendar(perms)).toBe(true);
  });
});

describe("resolvePermissions — coach", () => {
  it("can view management-only calendar", () => {
    const perms = resolvePermissions("coach", "management-only");
    expect(canViewCalendar(perms)).toBe(true);
  });

  it("cannot manage management-only calendar", () => {
    const perms = resolvePermissions("coach", "management-only");
    expect(canManageCalendar(perms)).toBe(false);
  });

  it("cannot view private calendar (not creator)", () => {
    const perms = resolvePermissions("coach", "private", undefined, false);
    expect(canViewCalendar(perms)).toBe(false);
  });

  it("can view team-only calendar", () => {
    const perms = resolvePermissions("coach", "team-only");
    expect(canViewCalendar(perms)).toBe(true);
  });
});

describe("resolvePermissions — member", () => {
  it("can view public-workspace calendar", () => {
    const perms = resolvePermissions("member", "public-workspace");
    expect(canViewCalendar(perms)).toBe(true);
  });

  it("cannot view management-only calendar", () => {
    const perms = resolvePermissions("member", "management-only");
    expect(canViewCalendar(perms)).toBe(false);
  });

  it("cannot manage any calendar", () => {
    const perms = resolvePermissions("member", "public-workspace");
    expect(canManageCalendar(perms)).toBe(false);
  });
});

describe("resolvePermissions — creator override", () => {
  it("captain as creator of private calendar gets full access", () => {
    const perms = resolvePermissions("captain", "private", undefined, true);
    expect(canViewCalendar(perms)).toBe(true);
    expect(canManageCalendar(perms)).toBe(true);
  });

  it("captain as non-creator of management-only gets no access", () => {
    const perms = resolvePermissions("captain", "management-only", undefined, false);
    expect(canViewCalendar(perms)).toBe(false);
  });
});

describe("resolvePermissions — null role", () => {
  it("returns empty permission set for null role", () => {
    const perms = resolvePermissions(null, "public-workspace");
    expect(perms.size).toBe(0);
  });
});

describe("isRoleHigherOrEqual", () => {
  it("owner >= owner", () => expect(isRoleHigherOrEqual("owner", "owner")).toBe(true));
  it("owner >= manager", () => expect(isRoleHigherOrEqual("owner", "manager")).toBe(true));
  it("owner >= member", () => expect(isRoleHigherOrEqual("owner", "member")).toBe(true));
  it("manager >= coach", () => expect(isRoleHigherOrEqual("manager", "coach")).toBe(true));
  it("coach is NOT >= manager", () => expect(isRoleHigherOrEqual("coach", "manager")).toBe(false));
  it("member is NOT >= captain", () => expect(isRoleHigherOrEqual("member", "captain")).toBe(false));
  it("captain >= captain", () => expect(isRoleHigherOrEqual("captain", "captain")).toBe(true));
  it("returns false for null role", () => expect(isRoleHigherOrEqual(null, "member")).toBe(false));
});
```

- [ ] **Step 2: Jalankan test**

```bash
rtk vitest run lib/permissions/__tests__/calendar-rules.test.ts
```

Expected output: `✓ lib/permissions/__tests__/calendar-rules.test.ts (23 tests)`

- [ ] **Step 3: Commit**

```bash
rtk git add lib/permissions/__tests__/calendar-rules.test.ts && rtk git commit -m "test: add calendar permission rules unit tests"
```

---

## Task 9: Expand features/finances tests

**Files:**
- Modify: `features/finances/__tests__/queries.test.ts`

- [ ] **Step 1: Baca file test yang sudah ada untuk tahu baris mana yang perlu ditambah**

```bash
rtk read features/finances/__tests__/queries.test.ts
```

- [ ] **Step 2: Tambahkan describe block baru di bawah test yang sudah ada**

Tambahkan setelah baris terakhir (setelah closing `});`) di file yang ada:

```typescript
describe("getFinanceSummary — edge cases", () => {
  it("handles all expenses (no income)", async () => {
    const rows = [
      {
        id: "1",
        amount: 300000,
        type: "expense" as const,
        category: "operasional",
        description: null,
        date: "2026-05-15",
        member_id: null,
        organization_id: "org-1",
        created_at: new Date().toISOString(),
        created_by: "user-1",
        balance_after: -300000,
      },
    ];
    const summary = await getFinanceSummary("org-1", 2026, 5, rows);
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpense).toBe(300000);
    expect(summary.balance).toBe(-300000);
  });

  it("sums multiple income entries correctly", async () => {
    const rows = [
      {
        id: "1",
        amount: 100000,
        type: "income" as const,
        category: "Iuran",
        description: null,
        date: "2026-05-01",
        member_id: null,
        organization_id: "org-1",
        created_at: new Date().toISOString(),
        created_by: "user-1",
        balance_after: 100000,
      },
      {
        id: "2",
        amount: 200000,
        type: "income" as const,
        category: "Sponsor",
        description: null,
        date: "2026-05-10",
        member_id: null,
        organization_id: "org-1",
        created_at: new Date().toISOString(),
        created_by: "user-1",
        balance_after: 300000,
      },
    ];
    const summary = await getFinanceSummary("org-1", 2026, 5, rows);
    expect(summary.totalIncome).toBe(300000);
    expect(summary.totalExpense).toBe(0);
    expect(summary.balance).toBe(300000);
  });
});
```

- [ ] **Step 3: Jalankan test**

```bash
rtk vitest run features/finances/__tests__/queries.test.ts
```

Expected output: `✓ features/finances/__tests__/queries.test.ts (6 tests)`

- [ ] **Step 4: Commit**

```bash
rtk git add features/finances/__tests__/queries.test.ts && rtk git commit -m "test: expand finance query edge case tests"
```

---

## Task 10: features/scrim summarizeAttendance tests

**Files:**
- Create: `features/scrim/__tests__/queries.test.ts`

> `summarizeAttendance` adalah satu-satunya pure function di `features/scrim/queries.ts` — tidak perlu Supabase mock.

- [ ] **Step 1: Tulis test file**

```typescript
// features/scrim/__tests__/queries.test.ts
import { describe, it, expect } from "vitest";
import { summarizeAttendance } from "@/features/scrim/queries";
import type { ScrimDetail } from "@/features/scrim/queries";

type AttendanceRow = ScrimDetail["attendances"][number];
type AttStatus = "confirmed" | "declined" | "tentative" | "pending";

// summarizeAttendance only reads r.attendance.status — cast is safe
const makeRow = (userId: string, status: AttStatus): AttendanceRow => ({
  attendance: { status } as AttendanceRow["attendance"],
  member: {
    user_id: userId,
    display_name: `Player ${userId}`,
    avatar_url: null,
    jersey_number: null,
    position: null,
  },
});

describe("summarizeAttendance", () => {
  it("returns all zeros for empty array", () => {
    const result = summarizeAttendance([]);
    expect(result).toEqual({ confirmed: 0, declined: 0, tentative: 0, pending: 0 });
  });

  it("counts a single confirmed attendance", () => {
    const result = summarizeAttendance([makeRow("u1", "confirmed")]);
    expect(result.confirmed).toBe(1);
    expect(result.declined).toBe(0);
    expect(result.tentative).toBe(0);
    expect(result.pending).toBe(0);
  });

  it("counts mixed statuses correctly", () => {
    const rows = [
      makeRow("u1", "confirmed"),
      makeRow("u2", "confirmed"),
      makeRow("u3", "declined"),
      makeRow("u4", "tentative"),
      makeRow("u5", "pending"),
      makeRow("u6", "pending"),
    ];
    const result = summarizeAttendance(rows);
    expect(result.confirmed).toBe(2);
    expect(result.declined).toBe(1);
    expect(result.tentative).toBe(1);
    expect(result.pending).toBe(2);
  });

  it("total count equals number of attendances", () => {
    const rows = [
      makeRow("u1", "confirmed"),
      makeRow("u2", "declined"),
      makeRow("u3", "tentative"),
    ];
    const result = summarizeAttendance(rows);
    const total = result.confirmed + result.declined + result.tentative + result.pending;
    expect(total).toBe(3);
  });
});
```

- [ ] **Step 2: Jalankan test**

```bash
rtk vitest run features/scrim/__tests__/queries.test.ts
```

Expected output: `✓ features/scrim/__tests__/queries.test.ts (4 tests)`

- [ ] **Step 3: Commit**

```bash
rtk git add features/scrim/__tests__/queries.test.ts && rtk git commit -m "test: add scrim summarizeAttendance unit tests"
```

---

## Task 11: Verifikasi total coverage dan push

- [ ] **Step 1: Jalankan full test suite dengan coverage**

```bash
rtk vitest run --coverage
```

- [ ] **Step 2: Cek angka coverage**

Dari output terminal, cari baris `All Files` dan pastikan coverage ≥ 10%.
Jika belum 10%, cek folder mana yang masih rendah:

```bash
rtk vitest run --coverage 2>&1 | grep -E "All Files|lib/|features/"
```

- [ ] **Step 3: Push ke remote**

```bash
rtk git push
```

- [ ] **Step 4: Tunggu CI selesai dan cek Codecov**

CI akan auto-upload coverage ke Codecov. Cek di Codecov dashboard bahwa branch `main` menunjukkan ≥ 10%.

---

## Estimasi Coverage Akhir

| Task | Lines Covered (est.) |
|---|---|
| Task 1: slug | ~28 |
| Task 2: format | ~30 |
| Task 3: wa-templates | ~90 |
| Task 4: shared validations | ~40 |
| Task 5: finance validations | ~35 |
| Task 6: scrim validations | ~120 |
| Task 7: calendar validations | ~140 |
| Task 8: calendar-rules permissions | ~120 |
| Task 9: finances queries (expand) | +15 |
| Task 10: scrim summarizeAttendance | ~15 |
| **Total** | **~733** |

**733 / 7264 = ~10.1%** ✓

---

## Catatan Troubleshooting

**Kalau test gagal karena import error pada `features/scrim/queries.ts`:**
File ini menggunakan `import "server-only"` di baris 1. Sudah di-stub di `__tests__/stubs/server-only.ts` dan di-alias di `vitest.config.ts`. Kalau masih error, cek bahwa alias `"server-only"` masih ada di `vitest.config.ts`.

**Kalau Zod test gagal dengan error aneh:**
Project ini menggunakan Zod v4. API berbeda dari v3 — pastikan tidak menggunakan `.parseAsync()` atau method yang tidak ada di v4. Gunakan `.safeParse()` saja.

**Kalau coverage tidak naik sesuai estimasi:**
v8 coverage menghitung executable lines, bukan total baris file. Data struktur besar (seperti `PERMISSION_MATRIX`) yang tidak di-branch bisa mengurangi effective coverage. Tambahkan test tambahan di `calendar-rules.test.ts` untuk visibility levels yang belum di-cover.
