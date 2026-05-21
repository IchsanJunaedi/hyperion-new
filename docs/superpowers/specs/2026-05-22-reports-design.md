# Reports Page — Design Spec
**Date:** 2026-05-22  
**Status:** Approved

---

## Overview

Upgrade halaman Reports dari monthly summary sederhana menjadi tabbed dashboard yang komprehensif. Tersedia di dua route dengan scope berbeda:

- `/dashboard/reports` — Owner, semua tab tersedia
- `/manage/reports` — Manager, tab terbatas (Overview, Scrim, Tournament saja — Finance dan Sponsor tidak tersedia)

---

## Struktur Navigasi

```
[Breadcrumb]
[Header: judul "Laporan" + tombol "Download PDF"]

[Month selector: Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des]
← berlaku untuk semua tab kecuali Sponsor

[Tab nav: Overview | Scrim | Tournament | Finance | Sponsor]
← Finance dan Sponsor hanya muncul di Owner (/dashboard/reports)

[Tab content]
```

Month selector dan tab state disimpan di URL search params (`?month=5&year=2026&tab=scrim`) agar bisa di-share dan di-refresh.

---

## Tab 1: Overview

Berisi ringkasan bulan yang dipilih + trend 6 bulan terakhir (trend selalu last 6 months, tidak ikut month selector).

### Row 1 — 4 stat cards
| Card | Data | Source |
|------|------|--------|
| Scrim Win Rate | `X% · 8W-3L-1D` | `scrim_results` |
| Turnamen | `X aktif / X selesai` | `tournaments` |
| Kehadiran | `X% avg rate` | `scrim_attendances` |
| Saldo Kas | `Rp X.XXX` surplus/defisit | `finances` (owner only — manager lihat member aktif) |

### Row 2 — Win rate trend (Recharts)
- Bar/line chart: 6 bulan terakhir
- Primary axis: % win rate per bulan
- Secondary: total scrim per bulan (sebagai bar di belakang)
- Selalu last 6 months, tidak terpengaruh month selector

### Row 3 — 2 kolom
**Kiri (Owner):** Finance trend 6 bulan — grouped bar: income vs expense per bulan  
**Kiri (Manager):** Attendance trend 6 bulan — line chart % avg kehadiran per bulan  
**Kanan (semua):** Aktivitas bulan ini — list kompak:
- X scrim dijadwalkan
- X tournament aktif
- X sponsor aktif *(owner only)*
- X member aktif

---

## Tab 2: Scrim

### Row 1 — 4 stat cards
Total · Menang · Kalah · Seri — sama seperti yang sudah ada, plus win rate progress bar.

### Row 2 — Per-divisi breakdown
Hanya muncul jika ada lebih dari 1 divisi atau ada scrim tanpa divisi.

| Divisi | Total | W | L | D | WR |
|--------|-------|---|---|---|----|
| Main Squad | 7 | 5 | 2 | 0 | 71% ██░ |
| Rising Squad | 3 | 2 | 1 | 0 | 67% ██░ |
| Tanpa Divisi | 2 | 1 | 0 | 1 | 50% █░ |

Win rate inline bar di kolom WR. Row disort by total scrim descending.

### Row 3 — Daftar scrim bulan ini
List kompak, tiap row: `[tanggal] · vs [lawan] · [format] · [divisi] · [W/L/D badge]`  
Informational only — tidak ada link klik (dashboard tidak punya workspace slug context).

**Data:** `scrims` JOIN `scrim_results` JOIN `divisions`, filter `scheduled_at` dalam bulan, scope ke `organization_id`.

---

## Tab 3: Tournament

### Row 1 — 3 stat cards
Total Turnamen · Masih Berjalan · Selesai

### Row 2 — List turnamen
Tiap turnamen sebagai card. Card menampilkan:
- Nama turnamen + status badge (ongoing/completed/upcoming)
- Tanggal mulai · nama divisi
- Stage breakdown (expandable/always open):
  - Tiap stage: label · hasil match (XW XL) atau "Belum dimainkan"

Empty state jika tidak ada turnamen di bulan yang dipilih.

**Data:** `tournaments` + `tournament_stages` + `tournament_matches`, filter `tournaments.start_date` dalam bulan, scope ke `organization_id`. Manager melihat semua turnamen org (manager kelola seluruh org, bukan per-divisi).

---

## Tab 4: Finance *(Owner only)*

### Row 1 — 3 stat cards
Pemasukan · Pengeluaran · Saldo (surplus/defisit dengan warna hijau/merah)

### Row 2 — Breakdown transaksi
Dua tabel terpisah (Pemasukan / Pengeluaran), kolom: Keterangan · Tanggal · Jumlah.  
Sort by tanggal descending. Tampilkan semua transaksi bulan itu (no pagination — bulan biasanya tidak terlalu banyak).

### Row 3 — Usage bar
"Bulan ini menggunakan X% dari total pemasukan"  
Progress bar sederhana, warna hijau jika < 80%, merah jika ≥ 80%.

**Data:** `finances` filter `date` dalam bulan, scope ke `organization_id`.

---

## Tab 5: Sponsor *(Owner only)*

Month selector **tidak mempengaruhi** tab ini — sponsor adalah kontrak ongoing.

### Row 1 — 3 stat cards
Total Sponsor · Aktif · Pending

### Row 2 — Grid sponsor
Tiap sponsor sebagai card: Nama · Status badge (aktif=hijau, pending=kuning, inactive=abu) · Tanggal mulai · Nilai per bulan · Catatan.

### Row 3 — Total nilai aktif
Highlighted number: "Total nilai sponsor aktif: Rp X.XXX.XXX / bulan"

**Data:** `sponsors` scope ke `organization_id`. Tidak ada filter bulan.

---

## PDF Export

Tombol "Download PDF" di header. Compile semua tab relevan jadi satu dokumen A4:

| Halaman | Konten | Kondisi |
|---------|--------|---------|
| 1 | Cover + Overview (stat cards + win rate bar) | Selalu |
| 2 | Scrim (cards + per-divisi tabel + list scrim) | Selalu |
| 3 | Tournament (cards + list turnamen + stages) | Selalu |
| 4 | Finance (cards + tabel transaksi) | Owner only |
| 5 | Sponsor (cards + list sponsor) | Owner only |

Footer tiap halaman: `Laporan Bulanan · [Bulan] [Tahun] · Hyperion Team · Halaman X/Y`

**Implementasi:** Refactor `buildPdf()` di `ReportView.tsx` jadi modular — satu function per section (`buildScrimSection`, `buildTournamentSection`, dst), dipanggil berurutan dengan `doc.addPage()` di antara section. `MonthlyReport` type di `queries.ts` diperluas dengan field baru.

---

## Data Architecture

### Perluasan `MonthlyReport` type (`features/reports/queries.ts`)

```typescript
interface MonthlyReport {
  month: string;
  year: number;
  scrims: {
    total: number; wins: number; losses: number; draws: number; winRate: number;
    byDivision: { divisionName: string; total: number; wins: number; losses: number; draws: number; winRate: number }[];
    list: { id: string; scheduledAt: string; opponentName: string; format: string; divisionName: string | null; isWin: boolean | null }[];
  };
  tournaments: {
    total: number; ongoing: number; completed: number;
    list: { id: string; name: string; status: string; startDate: string; divisionName: string | null; stages: { label: string; wins: number; losses: number }[] }[];
  };
  attendance: {
    totalMembers: number; avgAttendanceRate: number;
  };
  finances: {
    totalIncome: number; totalExpense: number; balance: number;
    incomeList: { description: string; date: string; amount: number }[];
    expenseList: { description: string; date: string; amount: number }[];
  } | null; // null untuk Manager
  sponsors: {
    total: number; active: number; pending: number;
    list: { name: string; status: string; startDate: string | null; valuePerMonth: number | null; notes: string | null }[];
    totalActiveValue: number;
  } | null; // null untuk Manager
  trend: {
    // Last 6 months (tidak ikut month selector, selalu 6 bulan terakhir dari hari ini)
    scrimWinRate: { month: string; year: number; winRate: number; total: number }[];
    finance: { month: string; year: number; income: number; expense: number }[] | null; // null untuk Manager
    attendance: { month: string; year: number; avgRate: number }[];
  };
  activity: {
    scrimsScheduled: number;
    tournamentsActive: number;
    sponsorsActive: number | null; // null untuk Manager
    membersActive: number;
  };
}
```

### Query strategy
- `generateMonthlyReport(orgId, year, month, role: 'owner' | 'manager')` — single function, role menentukan apakah Finance dan Sponsor diisi atau null
- Trend data di-fetch dalam fungsi yang sama dengan 6 query paralel (satu per bulan) — bisa di-optimize ke single query dengan `DATE_TRUNC` jika perlu

---

## File Changes

| File | Perubahan |
|------|-----------|
| `features/reports/queries.ts` | Expand `MonthlyReport` type, expand `generateMonthlyReport()` |
| `features/reports/components/ReportView.tsx` | Refactor jadi tabbed layout, modular PDF sections |
| `app/dashboard/(panel)/reports/page.tsx` | Pass `role='owner'` ke query, handle tab URL params |
| `app/manage/(panel)/reports/page.tsx` | **Baru** — clone dashboard reports page tapi `role='manager'`, hide Finance/Sponsor tabs |

Tidak ada migration baru — semua data sudah ada di tabel yang ada.

---

## Constraints

- Tidak ada chart library baru — gunakan **Recharts** (sudah ada di analytics page)
- Tidak ada tabel baru di database
- Manager version tidak pernah melihat data finansial atau sponsor
- Sponsor tab tidak punya filter bulan
- PDF export hanya via jsPDF (sudah ada), tidak pakai server-side rendering
