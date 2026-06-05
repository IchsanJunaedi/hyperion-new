# Prompt untuk Claude Code — Hyperion Feature Backlog

Salin teks di dalam blok kode di bawah ini, lalu paste langsung ke Claude Code.

---

```
Halo! Sebelum mulai, baca dulu dua file penting ini:

1. Baca `CLAUDE.md` — berisi semua aturan coding, arsitektur, pattern yang wajib diikuti
2. Baca `backlog.md` — berisi daftar fitur yang perlu dibangun (sudah diverifikasi belum ada)

Setelah baca kedua file itu, jalankan graphify untuk explore arsitektur codebase:

```powershell
$env:PATH += ";C:\Users\jokil\AppData\Roaming\Python\Python310\Scripts"
graphify query "bagaimana struktur fitur analytics, roster, calendar, dan scrim saling terhubung?"
```

---

Setelah semua konteks terbaca, kita akan kerjakan fitur-fitur dari `backlog.md` satu per satu.

**Urutan pengerjaan (dari yang paling cepat):**

1. **#10 — Link Public Profile dari Roster** (XS, <1 jam)
   - Join `username` dari `profiles` ke query roster
   - Tambah icon ExternalLink di `RosterTable.tsx` dan `RosterCardView.tsx`

2. **#9 — Export CSV Keuangan & Salary** (XS, <1 jam)
   - Tambah 3 entry baru di `ExportButtons.tsx`: finances, salaries, sponsors

3. **#6 — Scrim Reminder H-60** (XS, <2 jam)
   - Buat migration baru ikuti pola `20260517200000_h30_reminders.sql`

4. **#5 — Scrim Coach Summary** (S, half day)
   - Migration kolom `coach_summary TEXT` di tabel `scrims`
   - Action `updateCoachSummaryAction` + komponen `CoachSummarySection`

5. **#4 — Attendance Rate di Roster** (S, half day)
   - Batch-fetch attendance di `roster/queries.ts`
   - Tambah kolom kehadiran di `RosterTable.tsx` dan `RosterCardView.tsx`

6. **#1 — RSVP Count Badge di Calendar Grid** (S, half day)
   - Batch-fetch confirmed count dari `calendar_event_rsvps`
   - Tampilkan badge di tile event `CalendarGrid.tsx`

7. **#8 — Salary Dashboard Chart** (M, 1–2 hari)
   - Query `getSalaryOverview` + stat cards + mini bar chart di `SalaryPageClient.tsx`

8. **#3 — Head-to-Head Opponent Tab** (M, 1–2 hari)
   - Query `getOpponentSummary` + tab baru "Lawan" + `OpponentTab.tsx`

9. **#2 — Player Performance Trend Chart** (M, 1–2 hari)
   - Query `getPlayerTrendByMonth` + sparkline di `PlayerStatsTab.tsx`

10. **#7 — PWA Setup** (S, half day)
    - Buat `public/manifest.json` + meta tags di `app/layout.tsx` + icons

---

**Aturan wajib sebelum commit (dari CLAUDE.md):**
- Jalankan: `npm run lint` → harus 0 error
- Jalankan: `npm run typecheck` → harus exit 0
- Jalankan: `npm run test:unit:coverage` → semua pass + threshold terpenuhi
- Commit pakai `rtk commit` (JANGAN `git commit` manual)

**Mulai dari fitur #10 dulu.** Baca detail spesifikasi lengkapnya di `backlog.md` sebelum coding.
```
