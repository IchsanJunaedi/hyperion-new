# Hyperion — Feature Backlog (Verified)

> Dibuat: 2026-06-05. Semua status di bawah sudah disinkronkan dengan codebase saat ini.

## Referensi Role & Akses

```
Owner       → /dashboard          (akses penuh semua data)
Manager     → /manage             (roster, salary, sponsor, keuangan, laporan)
Coach       → /{slug}/workspace   (evaluasi scrim, VOD, strategy, announcement)
Captain     → /{slug}/workspace   (buat scrim, attendance, VOD, announcement)
Member      → /{slug}/workspace   (lihat jadwal, RSVP, lihat roster/analytics)
```

Semua workspace berada di route `/{team-slug}/(workspace)/`.  
Dashboard owner: `/dashboard/(panel)/`.  
Panel manager: `/manage/`.

---

## ✅ Yang Sudah Ada (Telah Selesai & Terverifikasi di Codebase)

Semua fitur di bawah ini telah diimplementasikan penuh pada codebase utama (termasuk batch pengerjaan terakhir):

| Fitur | Detail Implementasi |
|-------|---------------------|
| **RSVP Count di Kalender** | Tampil badge `X hadir` pada grid event `CalendarGrid.tsx` menggunakan `rsvpCounts`. |
| **Player Trend Chart** | Line chart 6 bulan untuk kehadiran + win rate di `PlayerHeroModal.tsx` (`MonthlyTrendSection`). |
| **Head-to-Head Database** | Tab dedicated **Lawan** di `AnalyticsDashboard.tsx` via `OpponentTab.tsx`. |
| **Attendance Rate di Roster** | Kolom persentase kehadiran berdasarkan data scrim di `RosterTable.tsx`. |
| **Scrim Coach Summary** | Kolom `coach_summary` di tabel `scrims` dengan section inline editor `CoachSummarySection.tsx`. |
| **Scrim Reminder H-60** | Migration `20260606000001_h60_scrim_reminder.sql` untuk cron reminder WA 1 jam sebelum scrim. |
| **PWA Setup** | `manifest.json` di folder `public/`, aset ikon, dan metadata viewport di `app/layout.tsx`. |
| **Salary Dashboard Chart** | Visualisasi total payroll, status outstanding, dan `SpendChart` di `SalaryPageClient.tsx`. |
| **Export CSV Lengkap** | Tombol export Keuangan, Kontrak Salary, dan Sponsor di `/dashboard/export` (`ExportButtons.tsx`). |
| **Link Public Profile** | Link icon `ExternalLink` ke `/players/[username]` dari halaman roster (`RosterTable.tsx`). |
| **Realtime Strategy Comments** | Live sync strategy comments menggunakan channel Supabase Realtime di `StrategyComments.tsx`. |
| **Realtime Notification Bell** | Badge notifikasi bell realtime via `NotificationRealtimeProvider.tsx`. |

---

## 🔴 BELUM ADA — Perlu Dibangun (Hasil Product Council)

Berikut adalah daftar fitur baru prioritas hasil rumusan Product Council yang belum ada di codebase dan perlu didelegasikan ke AI/Claude Code:

### 1. Rapor Pribadi (Player Performance View)
* **Status:** ❌ Belum ada  
* **Siapa yang pakai:** Member (Player)  
* **Route yang terpengaruh:** `/{slug}/performance` atau tab baru "My Performance" di workspace  
* **File terkait:**
  - Buat page/tab baru untuk view personal player.
  - `features/analytics/queries.ts` (gunakan query `scrim_attendances` terfilter `user_id = auth.uid()`)
* **Deskripsi:**  
  Coach sudah mengisi `rating (0-10)` dan `coach_notes` per player di setiap scrim, tapi player saat ini tidak memiliki halaman untuk melihat riwayat evaluasi diri mereka sendiri secara privat.
* **Yang perlu dilakukan:**
  1. Tampilkan halaman ringkasan performa individu untuk player yang sedang login.
  2. Tampilkan tren nilai rata-rata mereka dari waktu ke waktu dan daftar catatan evaluasi/feedback dari coach.

---

### 2. Player True Impact Score (Penyempurnaan Formulasi)
* **Status:** ❌ Belum ada formulasi dinamis  
* **Siapa yang pakai:** Coach, Manager, Owner  
* **Route yang terpengaruh:** `/{slug}/analytics` (Tab Player Stats)  
* **File terkait:**
  - `features/analytics/components/tabs/PlayerStatsTab.tsx`
* **Deskripsi:**  
  Fungsi `computeImpactScore` di frontend saat ini masih menggunakan fallback default `50` jika rating rata-rata kosong. Perlu dibuat pembobotan dinamis yang lebih akurat berdasarkan data kehadiran riil, win rate saat hadir, dan nilai rata-rata dari coach.
* **Yang perlu dilakukan:**
  1. Sesuaikan pembobotan formula di `computeImpactScore` agar selaras dengan performa kompetitif: `Attendance Rate (35%)` + `Win Rate When Present (35%)` + `Avg Coach Rating (30%)`.
  2. Pastikan jika rating belum ada, bobot dialihkan secara proporsional ke attendance & win rate tanpa merusak total skor (max 100).

---

### 3. Respect Ban Tracker (Analisis Ban Lawan)
* **Status:** ❌ Belum ada  
* **Siapa yang pakai:** Coach, Captain  
* **Route yang terpengaruh:** `/{slug}/analytics` (Tab baru/tambahan di bagian Ban)  
* **File terkait:**
  - `features/analytics/queries.ts`
  - `features/analytics/components/tabs/StatisticsTab.tsx`
* **Deskripsi:**  
  Kita merekam ban hero musuh di tabel `scrim_draft_bans` dengan `side = 'enemy'`. Kita perlu tahu hero milik tim kita apa yang paling sering di-ban oleh musuh (ini menunjukkan hero andalan kita yang ditakuti/di-respect ban oleh lawan).
* **Yang perlu dilakukan:**
  1. Buat query `getRespectBans(orgId)` di `features/analytics/queries.ts` untuk menghitung jumlah ban hero kita oleh enemy.
  2. Tampilkan visualisasi top 5 hero ter-ban oleh musuh di tab statistics/draft analytics.

---

### 4. VOD Mistake Heatmap / Match Phase Analysis
* **Status:** ❌ Belum ada  
* **Siapa yang pakai:** Coach, Captain, Member  
* **Route yang terpengaruh:** `/{slug}/scrim/[id]` (VOD Review Section)  
* **File terkait:**
  - `features/scrim/components/VodReviewSection.tsx`
  - `features/scrim/actions/vodTimestampsAction.ts`
* **Deskripsi:**  
  Timestamp VOD saat ini hanya memiliki catatan teks flat. Sulit melihat di fase pertandingan menit ke berapa tim paling sering melakukan kesalahan.
* **Yang perlu dilakukan:**
  1. Kelompokkan timestamp VOD secara dinamis ke dalam 3 fase pertandingan: *Early Game (<5 menit)*, *Mid Game (5-12 menit)*, dan *Late Game (>12 menit)*.
  2. Tampilkan bar progress atau indicator visual sederhana (Mistake Heatmap) di halaman scrim VOD review untuk menunjukkan distribusi kesalahan tim berdasarkan menit game.

---

### 5. Draft Archetype Win Rate
* **Status:** ❌ Belum ada  
* **Siapa yang pakai:** Coach, Captain  
* **Route yang terpengaruh:** `/{slug}/analytics` (Tab Draft Analytics)  
* **File terkait:**
  - `features/analytics/queries.ts`
  - `features/analytics/computations.ts`
* **Deskripsi:**  
  Mengetahui kecenderungan sinergi komposisi tim (misal: seberapa sukses tim saat bermain komposisi tanky/sustain vs komposisi assassin/dive).
* **Yang perlu dilakukan:**
  1. Klasifikasi draft picks kita secara rule-based sederhana di backend (contoh: jika roamer/jungler adalah Fighter/Tank berdarah tebal, klasifikasikan sebagai *Sustain/Poke Comp*; jika Assassin/Burst, klasifikasikan sebagai *Dive/Burst Comp*).
  2. Hitung win rate masing-masing archetype komposisi tim tersebut dan tampilkan persentasenya di tab Draft Analytics.
