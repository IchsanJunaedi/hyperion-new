# Coach Analytics Dashboard — Design Spec
**Date:** 2026-05-20  
**Status:** Approved  

---

## Overview

Setelah coach/captain menyimpan hasil scrim di `FinishScrimForm`, user langsung diarahkan ke halaman analytics terpusat. Dashboard ini menampilkan statistik scrim tim dalam satu halaman dengan tab navigation, tanpa page reload antar tab.

---

## User Flow

1. User submit `FinishScrimForm` → `finishScrimAction` sukses
2. Sonner toast muncul: `toast.success("Hasil scrim disimpan!")`
3. `router.push(`/${orgSlug}/analytics`)` — redirect ke dashboard
4. Dashboard load dengan tab Overview aktif, data sudah di-fetch di server

**Perubahan file:** `FinishScrimForm.tsx` — ganti 1 baris redirect target saja. `finishScrimAction` tidak berubah.

---

## Route

```
/{orgSlug}/analytics
```

Di bawah `app/[team-slug]/(workspace)/analytics/page.tsx` — masuk dalam protected workspace routes, akses untuk semua role yang punya akses workspace.

---

## Arsitektur

**Pendekatan: Server Component Page + Client Tab Switcher**

- `analytics/page.tsx` — Server Component, fetch semua data (Overview + Player Stats) secara parallel dengan `Promise.all`
- Data di-pass sebagai props ke `AnalyticsDashboard` client component
- Tab switching via `useState` — instan, tanpa loading per tab
- Tidak ada TanStack Query untuk halaman ini — data statis per page load

---

## File Structure

```
app/[team-slug]/(workspace)/analytics/
  page.tsx                          ← Server Component

features/analytics/
  components/
    AnalyticsDashboard.tsx          ← Client component, tab switcher
    tabs/
      OverviewTab.tsx
      DraftAnalyticsTab.tsx         ← Placeholder
      PlayerStatsTab.tsx
      AIInsightsTab.tsx             ← Placeholder
  queries.ts                        ← Semua analytics queries

features/scrim/components/
  FinishScrimForm.tsx               ← Modifikasi: ganti redirect target
```

---

## Tab: Overview

**Data source:** `scrims` + `scrim_results`

### Stat Cards (4 kolom)
| Card | Value | Warna |
|------|-------|-------|
| Total Scrim | count completed | white |
| Menang | wins | emerald-400 |
| Kalah | losses | rose-400 |
| Win Rate | wins/total % | yellow-400 jika ≥50%, rose jika <50% |

### Win Rate Bar
Progress bar horizontal, warna hijau/merah sesuai win rate. Label persentase di kanan.

### Format Breakdown
Row per format yang pernah dimainkan (BO1, BO2, BO3, BO5, BO7, 4Match):
- Label format | mini progress bar | "X W / Y L"

### Recent Scrims
10 scrim completed terakhir, kolom: Tanggal | Lawan | Format | Divisi | Skor (badge W/L hijau-merah)

---

## Tab: Draft Analytics

**Status:** Placeholder — tabel draft picks belum ada di DB.

UI: card centered dengan ikon `FlaskConical` dari Lucide, teks "Coming Soon", subjudul "Fitur analitik draft sedang dalam pengembangan."

---

## Tab: Player Stats

**Data source:** `scrim_attendances` + `scrim_results` + `team_members` + `profiles`

**Layout:** Grid 2-3 kolom responsive, 1 card per active member.

### Card per Player
- Avatar (foto atau inisial nama di `bg-[#252525]` circle)
- Nama + posisi + nomor jersey
- **Attendance Rate** — `confirmed / total_completed_scrims × 100` + progress bar
- **Win Rate saat hadir** — scrim di mana `scrim_attendances.status = 'confirmed'` AND `scrim_results.is_win = true`, dibagi total scrim yang player confirmed
- **Total hadir** — angka absolut scrim dengan status `confirmed`
- **Current streak** — iterasi dari scrim completed terbaru ke lama: hitung berapa scrim beruntun terakhir player `confirmed` (streak positif) atau tidak `confirmed` (streak negatif). Berhenti saat status berganti. Teks: "3 hadir beruntun" atau "1 absen terakhir"

**Sort default:** attendance rate tertinggi di atas.

**Komputasi:** dilakukan di `features/analytics/queries.ts` server-side, bukan di client.

---

## Tab: AI Insights

**Status:** Placeholder — sama dengan Draft Analytics.

UI: card centered dengan ikon `Sparkles`, teks "Coming Soon", subjudul "Analisis AI sedang dalam pengembangan."

---

## UI Design

Konsisten dengan Notion dark theme yang ada di proyek:

```
Background card:  bg-[#1C1C1C]  border border-[#2D2D2D]
Page background:  bg-[#191919]
Tab aktif:        border-b-2 border-yellow-400, text-white
Tab inactive:     text-white/40, hover:text-white/70
Menang:           text-emerald-400 / bg-emerald-500/10
Kalah:            text-rose-400   / bg-rose-500/10
Accent:           text-yellow-400
Avatar fallback:  bg-[#252525] text-white/60 (inisial)
```

Tab bar style: underline (border-bottom), bukan pill. Posisi: di bawah heading halaman, di atas konten tab.

---

## Queries Baru (`features/analytics/queries.ts`)

```typescript
getOverviewStats(orgId: string)     // aggregate W/L/D + win rate + format breakdown
getRecentScrims(orgId: string)      // 10 scrim completed terakhir dengan result
getPlayerStats(orgId: string)       // per-member: attendance rate + WR saat hadir + streak
```

Semua query menggunakan `createClient()` (server, respects RLS).

---

## Out of Scope

- Draft picks data & analytics (butuh migrasi DB baru — fase berikutnya)
- AI-generated insights (butuh integrasi AI API — fase berikutnya)
- Filter by date range / division (bisa ditambah nanti)
- Real-time updates (Supabase Realtime — bisa ditambah nanti)
