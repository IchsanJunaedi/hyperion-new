# Hyperion — Feature Backlog (Verified)

> Dibuat: 2026-06-05. Semua item di bawah sudah **diverifikasi manual ke codebase** — dipastikan belum ada sebelum masuk list ini.

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

## ✅ Yang Sudah Ada (Sempat Dikira Belum)

| Fitur | Status |
|-------|--------|
| Realtime strategy comments | ✅ Ada — `StrategyComments.tsx` subscribe ke `strategy-comments-${noteId}` |
| Realtime notification bell | ✅ Ada — `useNotificationsSubscription.ts` + `NotificationRealtimeProvider.tsx` |
| Reports page (Laporan Bulanan) | ✅ Ada & sudah di sidebar — `/dashboard/reports` dan `/manage/reports` sudah linked |
| Export CSV (anggota, scrim, hasil, pengumuman, profil) | ✅ Ada — `/dashboard/export` via `ExportButtons.tsx` |
| Coach bisa buat/edit/hapus announcement | ✅ Ada — migration `20260605120000_announcements_coach_permission.sql` |
| Public player profile | ✅ Ada — `/players/[username]` dengan avatar, team, achievements |

---

## 🔴 BELUM ADA — Perlu Dibangun

---

### 1. RSVP Count Badge di Calendar Grid View

**Status:** ❌ Belum ada  
**Siapa yang pakai:** Semua role (Owner, Manager, Coach, Captain, Member) — semua bisa lihat kalender workspace  
**Route yang terpengaruh:** `/{slug}/calendar`  
**File terkait:**
- `features/calendar/components/CalendarGrid.tsx`
- `features/calendar/queries.ts`

**Deskripsi:**  
Grid kalender menampilkan tile event tapi tidak ada indikator berapa orang yang sudah RSVP "hadir". Member harus masuk ke detail event dulu untuk tahu. Tabel `calendar_event_rsvps` sudah ada, tinggal di-batch-fetch countnya.

**Yang perlu dilakukan:**
1. Di `features/calendar/queries.ts` → di fungsi `listCalendarEvents`, setelah fetch events, batch-fetch count dari `calendar_event_rsvps` per event (filter `status = 'confirmed'`), gabungkan ke data event sebagai field `confirmed_count`
2. Di `CalendarGrid.tsx` → di tile event, tampilkan badge kecil `X hadir` di pojok kanan bawah jika `confirmed_count > 0`

---

### 2. Player Performance Trend Chart

**Status:** ❌ Belum ada  
**Siapa yang pakai:**
- **Coach & Captain** — untuk evaluasi perkembangan player
- **Manager & Owner** — untuk keputusan roster
- Tab "Player Stats" di `/[slug]/analytics` (semua role bisa akses analytics, tapi chart ini paling relevan untuk coach ke atas)

**Route yang terpengaruh:** `/{slug}/analytics` (tab Player Stats)  
**File terkait:**
- `features/analytics/components/tabs/PlayerStatsTab.tsx`
- `features/analytics/queries.ts`
- `features/analytics/actions.ts`

**Deskripsi:**  
Tab "Player Stats" menampilkan stat statis per player (attendance rate, win rate, avg rating). Tidak ada visualisasi tren dari waktu ke waktu. Data sudah ada di `scrim_attendances` dan `scrim_results` tapi belum diagregasi per-bulan.

**Yang perlu dilakukan:**
1. Di `features/analytics/queries.ts` → tambah fungsi `getPlayerTrendByMonth(orgId, userId)` — query `scrim_attendances` + `scrim_results` grup per bulan, hitung attendance rate dan win rate per bulan (6 bulan terakhir)
2. Di `features/analytics/actions.ts` → tambah Server Action wrapper `getPlayerTrendAction`
3. Di `PlayerStatsTab.tsx` → saat user klik nama player, tampilkan mini sparkline/line chart tren 6 bulan (bisa pakai SVG sederhana atau `recharts` jika sudah terinstall)

---

### 3. Head-to-Head Opponent Database (Tab Dedicated di Analytics)

**Status:** ❌ Belum ada sebagai halaman/tab — fungsi query sudah parsial  
**Siapa yang pakai:**
- **Coach** — prep strategi sebelum scrim
- **Captain** — referensi saat create scrim baru
- **Manager & Owner** — overview performa vs lawan tertentu

**Route yang terpengaruh:** `/{slug}/analytics` (tambah tab baru "Lawan")  
**File terkait:**
- `features/analytics/components/AnalyticsDashboard.tsx`
- `features/analytics/components/tabs/` (buat file baru `OpponentTab.tsx`)
- `features/analytics/queries.ts`
- `features/analytics/actions.ts`
- Catatan: `getOpponentHistory(orgId, opponentName, excludeScrimId)` di `features/scrim/queries.ts` sudah ada tapi hanya untuk per-scrim, bukan agregat semua lawan

**Deskripsi:**  
Belum ada tampilan yang menunjukkan semua lawan yang pernah dihadapi beserta aggregate stats (total scrim vs mereka, W/L/D, win rate). Berguna untuk prep sebelum scrim.

**Yang perlu dilakukan:**
1. Di `features/analytics/queries.ts` → tambah fungsi `getOpponentSummary(orgId)` — query `scrims` join `scrim_results`, grup by `opponent_name`, hitung total/wins/losses/winRate, sort by total descending
2. Di `features/analytics/actions.ts` → tambah Server Action wrapper `getOpponentSummaryAction`
3. Di `features/analytics/components/AnalyticsDashboard.tsx` → tambah tab "Lawan" di array tabs
4. Buat `features/analytics/components/tabs/OpponentTab.tsx` — tabel sortable: nama lawan | total scrim | W | L | D | win rate

---

### 4. Attendance Rate di Roster Page

**Status:** ❌ Belum ada  
**Siapa yang pakai:**
- **Coach & Captain** — untuk tahu siapa yang sering absen
- **Manager & Owner** — keputusan roster
- Member lain bisa lihat tapi data lebih relevan untuk leadership

**Route yang terpengaruh:** `/{slug}/roster`  
**File terkait:**
- `features/roster/components/RosterTable.tsx`
- `features/roster/components/RosterCardView.tsx`
- `features/roster/queries.ts`

**Deskripsi:**  
Halaman roster menampilkan nama, jersey, posisi, main role, role tim — tapi tidak ada kolom kehadiran. Data `scrim_attendances` bisa diagregasi per-user untuk menghitung attendance rate.

**Yang perlu dilakukan:**
1. Di `features/roster/queries.ts` → di fungsi list roster, setelah fetch members, batch-fetch `scrim_attendances` untuk org ini (limit 50 scrim terakhir), hitung `confirmed / total * 100` per user
2. Di `RosterTable.tsx` → tambah kolom "Kehadiran" (%) di grid dengan color coding:
   - Hijau: ≥75%
   - Kuning: 50–74%
   - Merah: <50%
   - Abu: belum ada data
3. Di `RosterCardView.tsx` → tambah badge attendance rate kecil di bawah nama player

---

### 5. Scrim Coach Summary / Catatan Ringkasan Per-Scrim

**Status:** ❌ Belum ada  
**Siapa yang pakai:**
- **Coach** — nulis ringkasan evaluasi keseluruhan scrim
- **Captain, Manager, Owner** — bisa edit juga
- **Member** — bisa baca (view only)

**Route yang terpengaruh:** `/{slug}/scrim/[id]` (halaman detail scrim)  
**File terkait:**
- `supabase/migrations/` (buat migration baru)
- `features/scrim/actions.ts`
- Halaman detail scrim (perlu cek komponen yang dipakai)

**Deskripsi:**  
Saat ini tidak ada field untuk catatan singkat coach keseluruhan per-scrim. Yang sudah ada:
- `coach_notes` di `scrim_attendances` → per-player (evaluasi individu)
- `VodReviewSection` (`scrim_vod_timestamps`) → per-game timestamp annotations
- Belum ada: ringkasan/evaluasi global untuk keseluruhan scrim

**Yang perlu dilakukan:**
1. Buat migration baru: `ALTER TABLE scrims ADD COLUMN coach_summary TEXT;`
2. Di `features/scrim/actions.ts` → tambah `updateCoachSummaryAction(scrimId, summary)` — validasi role: hanya coach/captain/manager/owner yang bisa edit
3. Di halaman detail scrim (`/{slug}/scrim/[id]`) → tambah section `CoachSummarySection`:
   - Tampil untuk semua role (read)
   - Form inline edit hanya muncul untuk coach ke atas
   - Jika kosong + role coach ke atas: tampil tombol "Tambah Catatan Coach"

---

### 6. Scrim Reminder H-60 (1 Jam Sebelum)

**Status:** ❌ Belum ada  
**Siapa yang pakai:** Semua member yang terdaftar di scrim — notif WA dikirim ke semua  
**Route yang terpengaruh:** Tidak ada route UI, ini background job  
**File terkait:**
- `supabase/migrations/20260517200000_h30_reminders.sql` ← referensi pola
- `supabase/migrations/20260513000002_h24_scrim_reminders.sql` ← referensi pola
- Buat file migration baru

**Deskripsi:**  
Sudah ada reminder H-24 jam dan H-30 menit via WA. Gap di tengah: tidak ada H-60 menit (1 jam sebelum). H-24 terlalu jauh untuk reminder "segera siap-siap", H-30 terlalu mepet untuk yang perlu persiapan lebih.

**Yang perlu dilakukan:**
1. Buat migration baru, contoh nama: `20260606000001_h60_scrim_reminder.sql`
2. Ikuti pola persis dari `20260517200000_h30_reminders.sql`:
   - Buat fungsi PostgreSQL `send_h60_scrim_reminders()`
   - Daftarkan ke `pg_cron` — jalan setiap 5 menit
   - Query: cari scrim `scheduled_at` antara NOW() + 55 menit dan NOW() + 65 menit, status = 'scheduled'
   - Insert ke `notifications` table dengan tipe reminder yang sesuai

---

### 7. PWA (Progressive Web App) — Mobile Installable

**Status:** ❌ Belum ada (tidak ada `manifest.json` sama sekali)  
**Siapa yang pakai:** Semua role, tapi paling berdampak untuk **Member & Captain** yang sering RSVP dari HP  
**Route yang terpengaruh:** Seluruh app  
**File terkait:**
- `app/layout.tsx`
- `public/` (buat folder `icons/`)

**Deskripsi:**  
Tidak ada `manifest.json` atau setup PWA. Player tidak bisa install aplikasi ke homescreen HP. Fitur RSVP scrim, lihat jadwal, dan cek announcement adalah use case mobile yang sangat umum.

**Yang perlu dilakukan:**
1. Buat `public/manifest.json`:
   ```json
   {
     "name": "Hyperion Team",
     "short_name": "Hyperion",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#191919",
     "theme_color": "#191919",
     "icons": [
       { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
   ```
2. Buat icon PNG 192×192 dan 512×512 di `public/icons/` (bisa crop dari logo yang sudah ada)
3. Di `app/layout.tsx` → tambah di `<head>`:
   ```tsx
   <link rel="manifest" href="/manifest.json" />
   <meta name="theme-color" content="#191919" />
   <meta name="mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
   ```
4. Opsional: tambah `next-pwa` untuk offline caching (jalankan `npm install next-pwa` lalu konfigurasi di `next.config.ts`)

---

### 8. Salary Dashboard Chart / Visualisasi Ringkasan Keuangan Gaji

**Status:** ❌ Belum ada  
**Siapa yang pakai:**
- **Owner** → `/dashboard/salaries`
- **Manager** → `/manage/salaries`
- Kedua halaman pakai komponen yang sama (`SalaryPageClient.tsx`)

**Route yang terpengaruh:** `/dashboard/salaries` dan `/manage/salaries`  
**File terkait:**
- `features/salary/components/SalaryPageClient.tsx`
- `features/salary/queries.ts`

**Deskripsi:**  
Halaman salary sudah ada CRUD penuh (kontrak, pembayaran, bonus) tapi halaman dibuka langsung ke list kontrak tanpa overview. Tidak ada ringkasan: berapa total yang harus dibayar bulan ini? Berapa yang sudah dibayar? Berapa outstanding?

**Yang perlu dilakukan:**
1. Di `features/salary/queries.ts` → tambah fungsi `getSalaryOverview(orgId)`:
   - Total kontrak aktif & total nilai bulanan
   - Total sudah dibayar bulan ini (dari `salary_payments`)
   - Total outstanding (kontrak aktif - sudah dibayar bulan ini)
   - Data pengeluaran 6 bulan terakhir untuk mini chart
2. Di `SalaryPageClient.tsx` → tambah section ringkasan di atas list kontrak:
   - 3 stat cards: "Kontrak Aktif", "Dibayar Bulan Ini", "Outstanding"
   - Mini bar chart horizontal pengeluaran 6 bulan (cukup SVG inline, tidak perlu library besar)

---

### 9. Export CSV — Tambah Data Keuangan & Salary

**Status:** ⚠️ Parsial — export dasar sudah ada, tapi data finansial belum tercakup  
**Siapa yang pakai:**
- **Owner saja** — data keuangan, salary, dan sponsor bersifat confidential
- Halaman: `/dashboard/export`

**Route yang terpengaruh:** `/dashboard/export`  
**File terkait:**
- `features/dashboard/components/ExportButtons.tsx`

**Deskripsi:**  
`ExportButtons.tsx` sudah bisa export: Profil User, Anggota Tim, Scrim, Hasil Scrim, Pengumuman. Yang belum ada: Keuangan (tabel `finances`), Kontrak Salary (tabel `player_contracts` + `salary_payments`), Sponsor (tabel `sponsors`).

**Yang perlu dilakukan:**
1. Di `ExportButtons.tsx` → tambah 3 entry baru di array `EXPORTS`:
   ```ts
   { key: "finances", label: "Keuangan", description: "Semua transaksi pemasukan & pengeluaran" },
   { key: "salaries", label: "Kontrak Salary", description: "Kontrak player & riwayat pembayaran" },
   { key: "sponsors", label: "Sponsor", description: "Daftar sponsor & nilai deal" },
   ```
2. Di fungsi `handleExport`, tambah handler untuk masing-masing key:
   - `finances`: query `finances` table, kolom: type, amount, category, description, date
   - `salaries`: query `player_contracts` join `salary_payments`, kolom utama: player_id, base_salary, start_date, end_date, status
   - `sponsors`: query `sponsors` table, kolom: name, status, deal_value, currency, start_date, notes

---

### 10. Link ke Public Profile dari Roster Page

**Status:** ❌ Belum ada — halaman `/players/[username]` berfungsi tapi tidak ada link ke sana dari dalam app  
**Siapa yang pakai:**
- Semua role bisa lihat link
- Paling berguna untuk **Captain & Manager** yang ingin share profil player ke luar tim (sponsor, rekrutmen)

**Route yang terpengaruh:** `/{slug}/roster`  
**File terkait:**
- `features/roster/components/RosterTable.tsx`
- `features/roster/components/RosterCardView.tsx`
- `features/roster/queries.ts`

**Deskripsi:**  
`/players/[username]` sudah ada dan fully functional (avatar, nama, tim, achievements) tapi tidak ada satu pun link di dalam app yang mengarah ke sana. User harus tahu URLnya secara manual. Seharusnya dari roster page bisa langsung buka profil publik player.

**Yang perlu dilakukan:**
1. Di `features/roster/queries.ts` → di fungsi list roster, join ke tabel `profiles` dan sertakan field `username` (sudah ada di tabel `profiles`)
2. Di `RosterTable.tsx` → di kolom nama player, tambah icon `ExternalLink` (Lucide) di sebelah kanan nama, yang jika diklik buka `/players/${username}` di tab baru. Hanya tampil jika `username` tidak null
3. Di `RosterCardView.tsx` → tambah tombol kecil "Profil Publik" dengan icon `ExternalLink` di card player, jika `username` ada

---

## 📋 Prioritas Pengerjaan

| # | Fitur | Siapa yang Pakai | Effort | Impact |
|---|-------|-----------------|--------|--------|
| 10 | Link Public Profile dari Roster | Semua | XS (<1 jam) | Med |
| 9 | Export CSV Keuangan & Salary | Owner | XS (<1 jam) | Med |
| 6 | Scrim Reminder H-60 | Semua (WA notif) | XS (<2 jam) | Med |
| 5 | Scrim Coach Summary | Coach, Captain, semua baca | S (half day) | Med |
| 4 | Attendance Rate di Roster | Coach, Captain, Manager | S (half day) | High |
| 1 | RSVP Count di Calendar Grid | Semua | S (half day) | High |
| 8 | Salary Dashboard Chart | Owner, Manager | M (1–2 hari) | Med |
| 3 | Head-to-Head Opponent Tab | Coach, Captain | M (1–2 hari) | High |
| 2 | Player Trend Chart | Coach, Captain, Manager | M (1–2 hari) | High |
| 7 | PWA Setup | Semua (terutama Member) | S (half day) | High |

**Effort:** XS = <2 jam, S = half day, M = 1–2 hari

---

## 🔮 Future Vision (Jangka Panjang, Tidak Urgent)

- **Tournament Bracket Auto-generator** — built-in bracket visual untuk Owner/Manager; saat ini hanya bisa upload file/link external
- **Multi-Game Support** — abstraksi game layer agar sistem bisa dipakai untuk VALORANT, Free Fire, PUBG Mobile selain MLBB
- **AI Coach Assistant** — integrasi Gemini API untuk Coach: analisis draft pattern, saran lineup berdasarkan `scrim_draft_picks` dan `scrim_vod_timestamps`
- **Light Mode** — CSS variable refactor 146 file TSX (sudah didokumentasikan detailnya di `progress.md` — jangan mulai sebelum palette diputuskan)
