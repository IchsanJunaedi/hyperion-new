# Bug & Performance Audit Report — Hyperion Esports OS
*28 Mei 2026*

---

## Ringkasan Eksekutif

| Severity | Jumlah | Status |
|----------|--------|--------|
| 🔴 High | 6 | Perlu segera diperbaiki |
| 🟡 Medium | 10 | Fix sebelum traffic naik |
| 🟢 Low | 8 | Nice-to-fix, bukan blocker |

**Good news:** B2-7 (`admin.auth.admin.listUsers`) sudah resolved. `notifications/queries.ts` dan `finances/queries.ts` dari B2-2 juga sudah bersih.

---

## Status B2 Items dari progress.md

| Item | Status |
|------|--------|
| B2-1 (unbounded queries) | ⚠️ Partial — `getDraftAnalytics` belum fix, `getOverviewStats` sudah |
| B2-2 (select *) | ⚠️ Partial — `notifications` & `finances` sudah fix, `announcements`/`scrims`/`sponsors` belum |
| B2-7 (listUsers) | ✅ Sudah resolved |
| B2-9 (waterfall report) | ⚠️ Partial — masih ~7 serial round-trips |

---

## Rekomendasi Urutan Fix

1. **H6** — Fix WA throw di `registerApplicantAction` (5 menit, risk tinggi)
2. **H2** — Add `.limit()` di `getDraftAnalytics` (5 menit, performance impact besar)
3. **H5** — Add error checks di analytics parallel queries (15 menit)
4. **H1** — Regenerate `types/database.ts` (eliminasi 30+ `as any` casts)
5. **M1** — Fix `player_target_history` limit semantics
6. **H3** — Ganti `select("*")` di announcements list (ambil kolom spesifik, skip `body`)

---

## 🔴 HIGH — Harus Diperbaiki

### H1. `types/database.ts` — 30+ lokasi `as any` cast

**Root cause:** 8 tabel tidak ada di type definitions sehingga dev terpaksa cast `(supabase as any).from(...)`.

**Tabel yang missing:**
- `announcement_reads`
- `calendar_event_rsvps`
- `calendar_event_comments`
- `scrim_review_requests`
- `scrim_draft_bans`
- `tournament_matches`
- `notification_preferences`
- `login_rate_limits`

**Files paling terdampak:**
- `features/calendar/queries.ts` — 8+ casts untuk rsvp, comments, attendees
- `features/announcements/queries.ts` — 4 casts untuk `announcement_reads`
- `features/calendar/actions.ts` — casts untuk comments dan rsvp
- `features/tournaments/queries.ts` + `actions.ts` — `tournament_matches`
- `features/scrim/actions.ts` — `scrim_review_requests`, `scrim_draft_bans`
- `features/scrim/queries.ts` — `scrim_review_requests`

**Fix:**
```bash
npx supabase gen types typescript --project-id pqzdukrlmbwjjgjyoqva --schema public > types/database.ts
```
Atau tambah table definitions secara manual ke `types/database.ts` jika gen fails.

---

### H2. `getDraftAnalytics` — Unbounded Scrim Fetch

**File:** `features/analytics/queries.ts` ~line 233

```ts
// ❌ MASALAH — Fetch SEMUA completed scrims tanpa limit
const { data: scrims } = await supabase
  .from("scrims")
  .select("id")
  .eq("organization_id", orgId)
  .eq("status", "completed");
// Lalu fetch ALL draft_picks + game_results untuk semua scrim itu
const [picksRes, gameResultsRes] = await Promise.all([
  supabase.from("scrim_draft_picks").select(...).in("scrim_id", scrimIds),
  supabase.from("scrim_game_results").select(...).in("scrim_id", scrimIds),
]);
```

Kalau org punya 500+ scrims, ini tarik ribuan row ke memory sekaligus. **Ini yang paling mungkin bikin lag saat live.**

**Fix:**
```ts
// Opsi A — limit scrim IDs
.eq("status", "completed")
.order("created_at", { ascending: false })
.limit(200)

// Opsi B — filter date window (2 tahun terakhir)
.gte("scheduled_at", new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString())
```

---

### H3. `select("*")` pada Tabel Besar — List Views

Files yang paling impactful (ganti dengan kolom spesifik):

| File | Line | Tabel | Masalah |
|------|------|-------|---------|
| `features/announcements/queries.ts` | 22, 45 | `announcements` | List view tarik full `body` text semua announcement |
| `features/scrim/queries.ts` | 51 | `scrims` | Table lebar (vod_link, notes, room_info, dll.) |
| `features/sponsors/queries.ts` | 62 | `sponsors` | Include `media_kit_url` + text panjang |
| `features/salary/queries.ts` | 39, 69 | `player_contracts`, `salary_payments` | Semua kolom |
| `features/strategy/queries.ts` | 18, 41, 67 | `strategy_notes`, `strategy_comments` | Full body di list view |
| `features/player-development/queries.ts` | 21, 32, 69, 79 | `player_targets`, `player_target_history` | Semua kolom |

**Prioritas tertinggi:** `announcements` list — `body` bisa panjang, diambil untuk semua announcement.

---

### H4. `export function` Pattern — HMR Crash Risk (~100+ komponen)

Per CLAUDE.md, semua komponen harus `const X = ...; export { X }`. Ini violasi yang belum di-enforce.

**Contoh violations:**
```
features/trials/components/TrialListClient.tsx:30
features/trials/components/TrialFormModal.tsx:20
features/scrim/components/VodReviewSection.tsx:42
features/scrim/components/AttendanceTracker.tsx:38
features/scrim/components/AttendanceList.tsx:44
features/polls/components/PollPageClient.tsx:18
features/polls/components/PollCard.tsx:17
features/notifications/components/NotificationBell.tsx:18
features/notifications/components/NotificationRealtimeProvider.tsx:13
features/analytics/components/tabs/StatisticsTab.tsx:76
features/meta/components/MetaPage.tsx:468
features/dashboard/components/CustomSelect.tsx:13
... ~100 lainnya di features/
```

**Note:** `page.tsx` dan `layout.tsx` di `app/` folder boleh pakai `export default function` — itu required oleh Next.js. Yang berisiko hanya file komponen di `features/`.

**Fix per file:**
```tsx
// ❌ WRONG
export function TrialListClient() { ... }

// ✅ CORRECT
const TrialListClient = () => { ... };
export { TrialListClient };
```

---

### H5. Silent Error Swallowing — Analytics Parallel Queries

**File:** `features/analytics/queries.ts` line 244–255

```ts
// ❌ Tidak ada error check sama sekali
const [picksRes, gameResultsRes] = await Promise.all([
  supabase.from("scrim_draft_picks").select(...).in(...),
  supabase.from("scrim_game_results").select(...).in(...),
]);
// Kalau query gagal → return data kosong
// User lihat dashboard kosong tanpa tahu ada error
```

Sama di `getEnterprisePlayerStats` — 4 parallel queries, tidak ada yang check `.error`.

**Fix:**
```ts
const [picksRes, gameResultsRes] = await Promise.all([...]);
if (picksRes.error) console.error("getDraftAnalytics picks:", picksRes.error);
if (gameResultsRes.error) console.error("getDraftAnalytics results:", gameResultsRes.error);
const picks = picksRes.data ?? [];
const gameResults = gameResultsRes.data ?? [];
```

---

### H6. `registerApplicantAction` — WA Throw Bisa Cancel Registrasi

**File:** `features/trials/actions.ts` line 277

```ts
// ❌ MASALAH
// Data sudah berhasil di-insert ke DB, tapi kalau WA API gagal
// (network error, nomor salah format) → throw propagate → user lihat error
// User submit ulang → potential duplicate (walaupun ada duplicate-phone check)
await sendWaMessage(phone, `Terima kasih telah mendaftar...`);
```

**Fix:**
```ts
// ✅ WA failure harus log, bukan throw
try {
  await sendWaMessage(phone, `Terima kasih telah mendaftar...`);
} catch (err) {
  console.error("[registerApplicantAction] WA send failed:", err);
  // Jangan propagate — registrasi tetap sukses
}
```

---

## 🟡 MEDIUM — Fix Sebelum Traffic Naik

### M1. `player_target_history` — Limit Semantically Wrong

**File:** `features/player-development/queries.ts` line 31–35

`.limit(30)` diterapkan ke SEMUA target sekaligus, bukan per-target. Kalau player punya 10 target dengan masing-masing 30 history → hanya 30 row total dikembalikan → history target lama tidak muncul.

**Fix:** Raise ke `.limit(200)` atau query per-target dengan limit individual.

---

### M2. `count: "exact"` Tanpa `head: true` — Double Cost

**Files:**
- `app/api/calendar/audit-logs/[calendarId]/route.ts` line 88
- `app/api/calendar/audit-logs/route.ts` line 73
- `features/dashboard/actions/fetchAuditLogs.ts` line 48
- `features/calendar/permission-queries.ts` line 420
- `lib/permissions/calendar-access.ts` line 613, 721

`select("*", { count: "exact" })` tanpa `head: true` transfer actual row data DAN lakukan full count scan — double cost.

**Fix:**
```ts
// Kalau hanya butuh count
.select("*", { count: "exact", head: true })

// Kalau butuh data + count, setidaknya select kolom minimal
.select("id", { count: "exact" })
```

---

### M3. `generateMonthlyReport` — Masih ~7 Serial Round-Trips

**File:** `features/reports/queries.ts` line 138–463

B2-9 sudah partial fix (step trend sudah pakai `Promise.all`) tapi masih ada chain serial:
`scrims → results → divisions → attendance → memberCount → tournaments → stages → matches`

`memberCount` di line 236 bisa diparallelkan dengan step `attendance` (line 227).

---

### M4. `PermissionGuard` — Async dalam useEffect Tanpa Cleanup

**File:** `features/calendar/components/permission/PermissionGuard.tsx` line 103–116

```ts
useEffect(() => {
  checkAccess().then(() => {
    setAllowed(...); // ❌ Bisa fire setelah komponen unmount
    setLoading(false);
  });
}, [...]);
```

**Fix:** Tambah mounted flag atau AbortController:
```ts
useEffect(() => {
  let mounted = true;
  checkAccess().then(() => {
    if (!mounted) return;
    setAllowed(...);
    setLoading(false);
  });
  return () => { mounted = false; };
}, [...]);
```

Sama di `PermissionButton` (line ~178) dan `PermissionConfirmDialog` (line ~258).

---

### M5. `getScrimWinLossRecord` — `.single()` Tanpa Error Handling

**File:** `features/scrim/queries.ts` line 271–280

```ts
// ❌ error tidak di-destructure
const { data } = await supabase.rpc("get_scrim_win_loss", { p_org_id: orgId }).single();
// Kalau RPC gagal → data = undefined → return wins: 0, losses: 0 (menyesatkan)
```

**Fix:**
```ts
const { data, error } = await supabase.rpc("get_scrim_win_loss", { p_org_id: orgId }).single();
if (error) console.error("getScrimWinLossRecord:", error);
```

---

### M6. `registerApplicantAction` — URL Storage Tidak Divalidasi

**File:** `features/trials/actions.ts` line 214–215

`screenshotUrl` dan `cvUrl` diterima dari client as-is tanpa validasi domain. Attacker bisa simpan URL eksternal atau arbitrary URLs.

**Fix:** Validasi URL berasal dari Supabase Storage domain:
```ts
const STORAGE_DOMAIN = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (screenshotUrl && !screenshotUrl.startsWith(STORAGE_DOMAIN)) {
  return { ok: false, message: "URL tidak valid" };
}
```

---

### M7. `subscribeToOrganizationCalendars` — Dead Code + Channel Leak

**File:** `lib/supabase/calendar-realtime.ts` line 346–365

Fungsi ini **tidak pernah dipanggil** di mana pun (dead code). Kalau dipanggil, channel references akan hilang dan cleanup tidak bisa menemukan channel → memory leak.

**Fix:** Delete fungsi ini.

---

### M8. `registerApplicantAction` — Tidak Ada Rate Limiting

**File:** `features/trials/actions.ts`

Form trial publik (tidak butuh login). Bot bisa spam submission dengan nomor phone berbeda-beda. Duplicate-phone check ada tapi tidak cukup.

**Fix (simple):** Tambah IP-based rate limiting atau Supabase RLS policy yang limit insert per time window.

---

## 🟢 LOW — Nice-to-Fix

| # | Issue | File | Line |
|---|-------|------|------|
| L1 | `NotifSection` — post-unmount state update via `.then()` | `features/settings/components/sections/NotifSection.tsx` | 45–68 |
| L2 | `listPlayerTargets` — tidak ada `.limit()` | `features/player-development/queries.ts` | 17 |
| L3 | `listCalendarEvents` — tidak ada safety limit (date-bounded tapi bisa lebar) | `features/calendar/queries.ts` | 28–35 |
| L4 | `getAnnouncementReadCountsBatch` — tidak ada error check | `features/announcements/queries.ts` | 148–164 |
| L5 | `markAnnouncementRead` — error silently swallowed (upsert result dibuang) | `features/announcements/queries.ts` | 56–70 |
| L6 | `listTrials` — tidak ada `.limit()` pada historical trials | `features/trials/queries.ts` | 52–68 |
| L7 | `AttendanceTracker` — `startTransition(no-op)` tiap realtime update | `features/scrim/components/AttendanceTracker.tsx` | 68–70 |
| L8 | `StatisticsTab` — fire-and-forget `.then()` tanpa cleanup | `features/analytics/components/tabs/StatisticsTab.tsx` | 83–89 |

---

## Fix yang Sudah Confirmed Resolved (Tidak Perlu Disentuh)

- ✅ B2-7 — `admin.auth.admin.listUsers` → sudah query dari `profiles` table
- ✅ `notifications/queries.ts` — sudah select kolom spesifik
- ✅ `finances/queries.ts` — sudah select kolom spesifik
- ✅ `getOverviewStats` — sudah ada `.limit(200)`
- ✅ `getEnterprisePlayerStats` — sudah ada `.limit(100)`
- ✅ Semua realtime subscriptions utama sudah ada cleanup (`removeChannel`)
- ✅ `TournamentCountdown` — sudah ada `clearInterval`
- ✅ `NotificationBell` — sudah ada `removeEventListener`
