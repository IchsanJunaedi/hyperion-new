# Hyperion Team — Dokumentasi Sistem (Materi Presentasi)

> **OS untuk Tim Esports** — satu platform untuk mengelola seluruh operasional tim esports: roster, scrim, jadwal, analitik, keuangan, gaji, sponsor, sampai situs publik tim.
> Dokumen ini disusun agar mudah dijelaskan saat presentasi: mulai dari *untuk siapa*, *fitur lengkapnya*, lalu *hierarki tiap panel* dan *isi tiap panel*.

---

## 1. Untuk Siapa Sistem Ini?

Hyperion dipakai oleh **organisasi/tim esports** yang ingin berhenti mengandalkan spreadsheet + grup WhatsApp yang berantakan. Targetnya:

| Pengguna | Kebutuhan utama yang dijawab |
|----------|------------------------------|
| **Owner / Pemilik tim** | Kontrol penuh: lihat semua data, kelola manager, tim, keuangan, gaji, sponsor, dan situs publik. |
| **Manager** | Operasional roster: kelola anggota, kapten, divisi, kontrak gaji, sponsor, laporan. |
| **Coach** | Evaluasi performa: nilai pemain per-scrim, catatan VOD, ringkasan coaching, strategi, meta. |
| **Captain (Kapten)** | Eksekusi harian tim: buat scrim, kelola kehadiran, jadwal, pengumuman. |
| **Member (Pemain)** | Partisipasi: konfirmasi kehadiran (RSVP), lihat jadwal & roster, lihat target perkembangan diri. |
| **Publik / Fans / Sponsor / Calon pemain** | Lihat profil tim, berita, galeri, hasil pertandingan, dan profil publik pemain; daftar trial/rekrutmen. |

**Inti nilai jual:** semua peran punya "pintu masuk" sendiri dengan akses yang tepat — tidak ada yang melihat lebih dari yang seharusnya, dan tidak ada yang perlu tahu hal teknis.

---

## 2. Ringkasan Teknologi (1 slide)

- **Framework:** Next.js 15 (App Router, Server Components + Server Actions)
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security + Edge Functions)
- **Login:** Email/password & Google OAuth
- **Notifikasi:** In-app realtime + **WhatsApp otomatis** (Fonnte) untuk reminder scrim
- **UI:** Tailwind CSS v4, tema gelap ala Notion, mobile-friendly (**bisa di-install sebagai aplikasi/PWA**)
- **Kualitas:** TypeScript strict, 700+ unit test, gate coverage di CI, E2E Playwright

---

## 3. Hierarki Peran & Pintu Masuk (Akses)

```
                       ┌─────────────────────────────────────────┐
                       │   OWNER  (ditentukan oleh OWNER_EMAIL)   │
                       │   → Akses SEMUA panel & SEMUA data       │
                       └─────────────────────────────────────────┘
                                        │ menunjuk
                ┌───────────────────────┼───────────────────────┐
                ▼                       ▼                        ▼
          ┌──────────┐           ┌──────────┐             ┌──────────┐
          │ MANAGER  │           │  COACH   │             │  ADMIN*  │
          │ /manage  │           │workspace │             │ /admin   │
          └────┬─────┘           └──────────┘             │(situs    │
               │ menunjuk                                  │ publik)  │
        ┌──────┴───────┐                                   └──────────┘
        ▼              ▼
   ┌──────────┐  ┌──────────┐
   │ CAPTAIN  │  │  MEMBER  │   → keduanya di workspace /{team-slug}
   └──────────┘  └──────────┘
```

| Peran | Ditentukan oleh | Pintu masuk (route) |
|-------|------------------|---------------------|
| **Owner** | Variabel `OWNER_EMAIL` (bukan tabel) | `/dashboard` |
| **Manager** | Ditunjuk Owner | `/manage` |
| **Coach** | Ditunjuk Owner | `/{team-slug}` (workspace) |
| **Captain** | Ditunjuk Manager (1 kapten / tim) | `/{team-slug}` (workspace) |
| **Member** | Ditunjuk Manager | `/{team-slug}` (workspace) |
| **Admin\*** | Owner (CMS situs publik) | `/admin` |
| **Publik** | Tanpa login | `/`, `/players/[username]`, dll |

> **Catatan "Admin":** Panel `/admin` adalah **CMS untuk situs publik tim** (hero, berita, galeri, sponsor, dll). Ini dikendalikan Owner — bukan peran ke-6 yang terpisah, melainkan "topi" lain yang dipakai Owner untuk mengelola wajah publik organisasi. Owner = super-admin sistem.

**Cara redirect otomatis:** setelah login, sistem cek peran di database lalu mengarahkan user ke panel yang tepat secara otomatis.

---

## 4. Isi Tiap Panel (Bagian Inti untuk Presentasi)

### 4.1 🟡 Panel OWNER — `/dashboard`

Kendali penuh atas organisasi. Menu yang tersedia:

| Menu | Fungsi |
|------|--------|
| **Teams** | Kelola tim/organisasi. |
| **Managers** | Tunjuk & kelola manager. |
| **Users** | Kelola seluruh akun pengguna. |
| **Divisions** | Kelola divisi (divisi bersifat standalone, baru di-link ke tim saat ditugaskan). |
| **Assign** | Tugaskan anggota ke divisi. |
| **Calendar** | Kelola kalender & event organisasi. |
| **Content** | Content calendar (jadwal konten sosial media). |
| **Tournaments** | Kelola turnamen (bracket + tracking match). |
| **Finances** | CRUD keuangan: pemasukan & pengeluaran. |
| **Salaries** | Kontrak gaji player, pembayaran, distribusi bonus turnamen. + **dashboard ringkasan cashflow**. |
| **Sponsors** | Tracker sponsor + dashboard ROI. |
| **Files** | Manajemen file organisasi. |
| **Reports** | Laporan bulanan. |
| **Export** | Export data ke CSV (anggota, scrim, hasil, pengumuman, **keuangan, gaji, sponsor**). |
| **Audit** | Audit log — siapa melakukan apa, kapan. |

> Owner juga otomatis bisa membuka **semua** menu di Manager dan Workspace.
> Owner **dikecualikan** dari daftar penerima gaji (karena berbagi revenue bisnis, bukan digaji).

---

### 4.2 🟢 Panel MANAGER — `/manage`

Fokus pada operasional roster & finansial tingkat tim:

| Menu | Fungsi |
|------|--------|
| **Captains** | Kelola kapten (1 kapten per tim, ditegakkan di server). |
| **Assign** | Tugaskan anggota ke divisi. |
| **Divisions** | Kelola divisi. |
| **Development** | Target skill pemain (player development). |
| **Content** | Content calendar. |
| **Finances** | CRUD keuangan. |
| **Salaries** | Kelola kontrak gaji + **dashboard ringkasan**. |
| **Sponsors** | Tracker sponsor. |
| **Reports** | Laporan. |

Manager bisa menunjuk **Captain** dan **Member**, mengatur kehadiran/role, tapi tidak bisa menyentuh Owner.

---

### 4.3 🔵 COACH — Workspace `/{team-slug}`

Coach masuk ke **workspace tim** (sama seperti kapten/member) tetapi dengan fokus evaluasi:

- **Scrim** → menilai performa pemain per-scrim, mengisi **rating + catatan coach per pemain**, kelola **link VOD**, anotasi **timestamp VOD per game**, dan **Ringkasan Coach (Catatan keseluruhan scrim)** ✨baru.
- **Strategy** → tulis catatan strategi + komentar (realtime).
- **Announcements** → buat/edit/hapus pengumuman.
- **Analytics** → lihat statistik tim, draft analytics, statistik pemain, **tren 6 bulan pemain** ✨, **database lawan (head-to-head)** ✨.
- **Meta** → meta tracker MLBB.
- **Calendar, Roster, Files, Tournaments, Polls, Development (read), Trials** → akses penuh sesuai konteks.

---

### 4.4 🟣 CAPTAIN — Workspace `/{team-slug}`

Eksekutor harian tim:

- **Scrim** → **buat scrim**, kelola kehadiran (attendance), input hasil & skor, kelola link VOD, ringkasan coach.
- **Calendar** → buat & kelola event, lihat **jumlah RSVP "hadir" langsung di grid kalender** ✨.
- **Announcements** → buat pengumuman (read receipts + acknowledgement).
- **Roster** → lihat anggota, **% kehadiran tiap pemain** ✨, **link ke profil publik** ✨.
- **Polls** → buat polling (reguler + grid ketersediaan/availability).
- **Tournaments, Strategy, Files, Analytics, Meta** → akses sesuai konteks.

---

### 4.5 ⚪ MEMBER (Pemain) — Workspace `/{team-slug}`

Partisipasi sebagai pemain:

| Modul | Untuk Member |
|-------|--------------|
| **Scrim** | Lihat scrim & **RSVP (konfirmasi kehadiran)**. |
| **Calendar** | Lihat jadwal + RSVP event. |
| **Announcements** | Baca pengumuman + tandai sudah dibaca/ack. |
| **Roster** | Lihat daftar anggota tim. |
| **Development** | Lihat **target skill pribadi** & progres. |
| **Polls** | Ikut voting. |
| **Strategy / Meta / Files / Analytics / Tournaments** | Lihat (view) sesuai izin. |
| **Settings** | Atur preferensi notifikasi. |

---

### 4.6 ⚙️ Panel ADMIN (CMS Situs Publik) — `/admin`

Mengelola **website publik tim** yang dilihat fans, sponsor, dan calon pemain:

| Menu | Fungsi |
|------|--------|
| **Hero** | Banner/hero utama landing page. |
| **Navigation / Footer / SEO** | Struktur situs & optimasi mesin pencari. |
| **News** | Kelola berita/artikel. |
| **Gallery** | Galeri foto/momen. |
| **Achievements** | Pencapaian/prestasi tim. |
| **Players** | Showcase pemain (terhubung ke profil publik). |
| **Results** | Hasil pertandingan publik. |
| **Tournaments** | Turnamen versi publik. |
| **Partners / Sponsor Control** | Tampilan sponsor & partner di situs. |
| **Testimonials** | Testimoni. |
| **About / Contact / Join / Rekrutmen** | Halaman statis & form pendaftaran/rekrutmen. |

---

### 4.7 🌐 Halaman Publik (Tanpa Login) & Profil Publik Pemain

Wajah publik organisasi — bisa diakses siapa saja:

- **Landing page** (`/`) + `about`, `contact`, `privacy`, `terms`
- **News** (`/news`, `/news/[slug]`) — berita tim
- **Gallery** (`/gallery`, `/gallery/[slug]`) — galeri
- **Results** (`/results`) & **Schedule** (`/schedule`) — hasil & jadwal publik
- **Sponsors** (`/sponsors`) — daftar sponsor publik
- **Rekrutmen / Trial** (`/rekrutmen`, `/trial/[token]`) — pipeline open trials
- **Divisions** (`/divisions`) — divisi publik
- **Profil Publik Pemain** (`/players/[username]`) ✨ — avatar, nama, tim, pencapaian; **kini bisa langsung dibuka dari halaman Roster** lewat ikon link.

> Custom domain didukung: middleware memetakan domain kustom ke slug organisasi.

---

## 5. Daftar Fitur Lengkap per Modul

### Manajemen Tim & Orang
- Roster (anggota, jersey, posisi, main role, availability) — **+ % kehadiran & link profil publik** ✨
- Sistem peran 5 tingkat + redirect otomatis berbasis peran
- Sistem undangan (invite via token) & onboarding (org + profil)
- Divisi standalone yang bisa di-link ke tim

### Scrim (Latih Tanding)
- CRUD scrim (format bo1/bo2/bo3/bo5/bo7/4match)
- Attendance tracking + RSVP per pemain
- Input hasil per-game & per-scrim, skor, rating, screenshot
- Draft picks & ban per game → **Draft Analytics & statistik hero**
- **VOD:** 1 link per scrim + anotasi timestamp per game
- **Ringkasan Coach per scrim** ✨ (evaluasi global)
- Riwayat head-to-head vs lawan di halaman detail
- **Reminder WhatsApp otomatis: H-24 jam, H-1 jam** ✨, **H-30 menit**

### Kalender & Jadwal
- Kalender terpadu (event manual + turnamen)
- Tipe event: tournament, practice, meeting, bootcamp, other
- 4 tingkat visibilitas (all / management / coach_up / private) + sistem izin
- RSVP event + **badge jumlah "hadir" langsung di grid** ✨

### Analitik
- Overview (win rate, breakdown format)
- Statistik hero (pick/ban/win rate) + detail per hero
- Draft analytics per role
- Player stats (Impact Score, hero pool, rating) + **tren 6 bulan (kehadiran & win rate)** ✨
- **Database lawan / Head-to-Head** ✨ (W/L/D & win rate per lawan)
- Export PDF

### Komunikasi
- Pengumuman (read receipts + acknowledgement)
- Strategi (catatan + komentar realtime)
- Polls (reguler + grid ketersediaan)
- Notifikasi in-app realtime (bell) + WhatsApp

### Finansial
- Keuangan (pemasukan/pengeluaran)
- **Gaji:** kontrak player, pembayaran, distribusi bonus turnamen + **dashboard cashflow (dibayar bulan ini, outstanding, tren 6 bulan)** ✨
- Sponsor tracker + ROI dashboard
- **Export CSV keuangan, gaji, sponsor** ✨ (rahasia — khusus Owner)

### Lainnya
- Player development (target skill + progres)
- Meta tracker MLBB
- File management (upload/download, link ke konteks)
- Open trials pipeline
- Turnamen (bracket + stage + tracking)
- Audit log
- **PWA — bisa di-install ke homescreen HP** ✨

---

## 6. Sistem Pendukung di Balik Layar

- **Keamanan:** Row Level Security (RLS) di semua tabel; admin client hanya untuk operasi lintas-user; rate limiting di form publik; validasi URL upload harus dari storage Supabase; MFA.
- **Notifikasi WhatsApp:** antrian diproses via Edge Function + pg_cron (reminder terjadwal).
- **Audit:** setiap aksi penting tercatat (siapa, apa, kapan).
- **Kualitas:** 718 unit test lulus, gate coverage (statements ≥80%, branches ≥75%) di CI, type-check strict, E2E Playwright, build produksi tervalidasi.

---

## 7. Fitur Baru (Highlight Rilis Ini)

Sepuluh item dari backlog — sembilan dibangun pada rilis ini (satu sudah ada sebelumnya):

| # | Fitur | Untuk siapa | Panel |
|---|-------|-------------|-------|
| 1 | Badge jumlah RSVP di grid kalender | Semua | Workspace · Calendar *(sudah ada sebelumnya)* |
| 2 | Tren 6 bulan pemain (kehadiran + win rate) | Coach, Captain, Manager | Workspace · Analytics |
| 3 | Database lawan / Head-to-Head | Coach, Captain | Workspace · Analytics (tab **Lawan**) |
| 4 | % Kehadiran di halaman Roster | Coach, Captain, Manager | Workspace · Roster |
| 5 | Ringkasan Coach per scrim | Coach (tulis), semua (baca) | Workspace · Scrim detail |
| 6 | Reminder WhatsApp H-1 jam | Semua (notif WA) | Background job |
| 7 | PWA (aplikasi installable di HP) | Semua, terutama Member | Seluruh app |
| 8 | Dashboard cashflow gaji | Owner, Manager | Dashboard/Manage · Salaries |
| 9 | Export CSV keuangan/gaji/sponsor | Owner | Dashboard · Export |
| 10 | Link ke profil publik dari Roster | Semua | Workspace · Roster |

---

*Dokumen ini ringkasan fungsional untuk presentasi. Detail teknis & inventaris fitur terkini ada di `progress.md`, dan aturan arsitektur di `CLAUDE.md`.*
