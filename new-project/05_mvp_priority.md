# EsportsOS — MVP Feature Priority

## Phase 1 — Core (Bulan 1–2, WAJIB Selesai)

> Semua fitur di bawah harus berjalan sebelum beta launch. Ini adalah value proposition minimum.

---

### 1.1 Setup Organisasi & Onboarding

**Effort: M**

| Kriteria | Detail |
|---|---|
| **Acceptance Criteria** | Owner bisa buat org dalam < 5 menit, slug otomatis disuggest, undangan bisa dikirim via link atau WA |
| **Dependencies** | Supabase Auth, table `organizations`, `organization_invites` |
| **Risk** | Slug conflict → mitigasi: validasi real-time + suggest alternatif |

**Sub-fitur:**
- [ ] Register/login via email (+ Google OAuth opsional)
- [ ] Create organization (name, slug, divisi awal)
- [ ] Generate invite link per divisi dengan role
- [ ] Accept invite flow (link → register/login → auto-join)
- [ ] Profile setup: nama, avatar, nomor WA, game ID

---

### 1.2 Roster Management

**Effort: M**

| Kriteria | Detail |
|---|---|
| **Acceptance Criteria** | Captain bisa lihat semua anggota, ubah role, dan nonaktifkan member; Member bisa lihat roster tim |
| **Dependencies** | `team_members`, `profiles`, Auth |
| **Risk** | Hapus member yang punya data terkait → mitigasi: soft-delete (`is_active = false`) |

**Sub-fitur:**
- [ ] Halaman roster: tampil nama, avatar, role, divisi, posisi, jersey number
- [ ] Captain: ubah role anggota, assign posisi
- [ ] Owner: nonaktifkan/aktifkan anggota
- [ ] Member bisa lihat roster tim sendiri

---

### 1.3 Scrim Management (PRIORITAS UTAMA)

**Effort: L**

| Kriteria | Detail |
|---|---|
| **Acceptance Criteria** | Captain bisa buat, edit, hapus scrim; sistem otomatis kirim notif WA ke semua member divisi; Member bisa konfirmasi hadir; Captain lihat status kehadiran real-time |
| **Dependencies** | `scrims`, `scrim_attendances`, `scrim_results`, Fonnte, Supabase Realtime |
| **Risk** | Notif WA gagal → mitigasi: retry queue + status `failed` terlihat di dashboard Captain |

**Sub-fitur:**
- [ ] Form buat scrim (jadwal, lawan, format, catatan)
- [ ] List scrim: upcoming, ongoing, completed
- [ ] Detail scrim: info lengkap + attendance tracker
- [ ] Tombol konfirmasi hadir (Hadir / Tidak / Ragu) → 1 klik
- [ ] Attendance tracker real-time (Supabase Realtime)
- [ ] Form input hasil scrim (skor + catatan)
- [ ] Otomatis kirim notif WA saat scrim dibuat
- [ ] Otomatis kirim reminder WA 1 jam sebelum scrim

---

### 1.4 Notifikasi WhatsApp (Fonnte)

**Effort: M**

| Kriteria | Detail |
|---|---|
| **Acceptance Criteria** | Notif WA terkirim dalam < 2 menit setelah trigger; delivery rate > 90%; Captain bisa lihat status pengiriman per member |
| **Dependencies** | Fonnte API token, `notifications`, Supabase Edge Function + pg_cron |
| **Risk** | Fonnte rate limit / downtime → mitigasi: queue dengan retry, fallback in-app notif |

**Sub-fitur:**
- [ ] Setup Fonnte API client
- [ ] Queue system: tabel `notifications` + Edge Function processor
- [ ] Template pesan WA: scrim invite, reminder, pengumuman
- [ ] Dashboard Captain: status WA per member (sent/failed/pending)
- [ ] Notif in-app sebagai backup (bell icon + dropdown)

---

### 1.5 Calendar Tim

**Effort: S**

| Kriteria | Detail |
|---|---|
| **Acceptance Criteria** | Member bisa lihat semua event (scrim + tournament + custom) dalam tampilan kalender dan list; Event scrim otomatis muncul saat scrim dibuat |
| **Dependencies** | `calendar_events`, `scrims`, `tournaments` |
| **Risk** | Rendah |

**Sub-fitur:**
- [ ] Tampilan kalender bulanan + list view
- [ ] Auto-sync: scrim baru → calendar event terbuat otomatis
- [ ] Captain tambah event custom (latihan, meeting)
- [ ] Filter per divisi

---

### 1.6 Team Home / Workspace Dashboard

**Effort: M**

| Kriteria | Detail |
|---|---|
| **Acceptance Criteria** | Halaman pertama setelah login terasa seperti "landing page tim yang hidup", bukan dashboard kaku; Loading < 1.5 detik |
| **Dependencies** | Semua fitur di atas |
| **Risk** | UX overload → mitigasi: mobile-first, prioritas info terpenting (scrim berikutnya, kehadiran) |

**Sub-fitur:**
- [ ] Hero section: nama tim, divisi aktif, skor win/loss terkini
- [ ] Scrim berikutnya: countdown + tombol konfirmasi hadir
- [ ] Activity feed: aksi terbaru (scrim dibuat, member join, hasil di-input)
- [ ] Quick stats: win rate, jumlah scrim bulan ini, anggota aktif
- [ ] Announcement pinned (jika ada)

---

### Phase 1 — Dependency Graph

```
Auth & Profile
    └── Setup Organisasi + Invite
            ├── Roster Management
            └── Scrim Management
                    ├── WA Notification
                    ├── Attendance Realtime
                    └── Calendar (auto-sync)
                            └── Team Home Dashboard
```

---

## Phase 2 — Growth (Bulan 3–4)

> Fokus: **retention** dan **diferensiasi** vs WA grup + Notion.

| Fitur | Effort | Tier | Keterangan |
|---|---|---|---|
| **Strategy Notes / Bank Strategi** | M | Komunitas+ | Editor markdown, tag, search, pin |
| **Tournament Tracker** | M | Semua | Input tournament, catat placement, link ke kalender |
| **Win/Loss Statistics** | M | Komunitas+ | Grafik win rate per bulan, per lawan, per format |
| **Announcements dengan WA Blast** | S | Semua | Captain kirim pengumuman → auto-blast WA ke semua member |
| **Polling / Quick Vote** | S | Komunitas+ | Vote waktu scrim, vote strategi, dll |
| **Public Profile Tim** | S | Semua | Halaman publik (read-only): roster, prestasi, statistik |
| **File Upload & Lampiran** | M | Semua | Lampirkan file ke scrim, strategy note (batas per tier) |
| **Achievement Board** | S | Komunitas+ | Catat prestasi tournament, tampil di public profile |
| **Mobile PWA Support** | M | Semua | Install ke homescreen, push notification (fallback WA) |

---

## Phase 3 — Scale (Bulan 5–6)

> Fokus: **monetisasi**, **org Pro**, dan **data-driven insights**.

| Fitur | Effort | Tier | Keterangan |
|---|---|---|---|
| **Custom Domain** | L | Pro | Setup wildcard Vercel + UI input domain di settings |
| **Advanced Analytics Dashboard** | L | Pro | Heatmap aktivitas, performa per member, scrim trend |
| **AI Performance Insights** | L | Pro | Analisis catatan scrim → saran rotasi, draft priority |
| **VOD Library** | L | Pro | Upload & tonton replay, link YouTube, annotasi |
| **Sponsor Page** | M | Pro | Halaman sponsor publik, logo + link |
| **Multi-division Dashboard** | M | Pro | Owner lihat semua divisi dalam 1 tampilan aggregat |
| **Billing & Tier Upgrade** | L | Semua | Integrasi Midtrans/Stripe, invoice, manage subscription |
| **Bulk WA Blast History** | S | Komunitas+ | Log semua blast WA yang pernah dikirim |
| **API Publik (Read-only)** | L | Pro | Akses data org via API untuk integrasi eksternal |
| **Challonge Integration** | M | Komunitas+ | Sync bracket tournament dari Challonge |

---

## Risk Register Phase 1

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Fonnte API down | Medium | High | Queue + retry, fallback in-app notif |
| User WA berubah nomor | Low | Medium | Profil bisa update nomor WA kapan saja |
| Supabase Realtime disconnect | Low | Medium | Optimistic updates + polling fallback setiap 10 detik |
| Slug collision antar org | Low | High | Validasi unique real-time saat input, auto-suggest suffix |
| Performance lambat di HP low-end | Medium | High | Server-side rendering (SSR) untuk halaman utama, lazy load komponen berat |
| RLS misconfiguration (data leak) | Low | Critical | Review RLS setiap PR, integration test isolasi data antar org |
