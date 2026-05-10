# EsportsOS — Product Requirements Document (PRD)

## Problem Statement

Tim esports Indonesia — khususnya tingkat pelajar hingga semi-pro — beroperasi menggunakan 5–7 alat berbeda secara bersamaan: WhatsApp untuk koordinasi, Google Drive untuk dokumen, Challonge untuk bracket, Notion untuk catatan strategi, dan Discord untuk komunikasi. Fragmentasi ini menghasilkan masalah nyata:

- **Jadwal scrim kacau**: Konfirmasi hadir via WA grup mudah tenggelam, tidak ada notifikasi terstruktur.
- **Roster tidak terkelola**: Tidak ada satu sumber kebenaran untuk siapakah anggota aktif, cadangan, atau keluar.
- **Strategi hilang**: Dokumen Notion tidak diakses konsisten, file tersebar di Drive berbeda.
- **Captain kelelahan**: Semua dikelola manual — Captain merangkap manajer, sekretaris, dan admin teknis.
- **Owner tidak punya visibilitas**: Tidak ada dashboard untuk lihat performa tim, kehadiran, atau perkembangan divisi.

---

## Target User Segments & Persona

| Segmen | Tier | Persona |
|---|---|---|
| **Pelajar** | Gratis | Dani, 16 tahun, main MLBB di tim sekolah. Fokusnya main, bukan admin. Butuh tahu jadwal & konfirmasi hadir dalam 1 klik. |
| **Komunitas** | Komunitas | Rizal, 22 tahun, Captain tim semi-pro lokal. Kelola 10+ anggota, butuh roster, statistik, dan pengumuman terstruktur. |
| **Pro** | Pro | Kevin, 27 tahun, Manager org esports dengan 3 divisi. Butuh analitik, custom domain, sponsor page, dan laporan performa. |

---

## Core Value Proposition

- **Pelajar**: "Tahu jadwal, konfirmasi hadir, selesai — tanpa pindah-pindah app."
- **Komunitas**: "Satu tempat untuk kelola scrim, roster, dan statistik tim tanpa chaos WA grup."
- **Pro**: "OS lengkap untuk organisasi esports — dari roster hingga sponsor, dari analytics hingga custom domain."

---

## Key User Journeys

### Journey 1 — Owner Setup Organisasi
1. Owner mendaftar → pilih nama org, slug, dan divisi (MLBB, Valorant, dll).
2. Sistem generate workspace URL: `hyperionteam.id/hyperion-six`.
3. Owner kirim link undangan ke Captain & Member via WhatsApp atau link.
4. Anggota klik link → daftar/login → otomatis masuk ke tim dengan role yang ditetapkan Owner.
5. Owner atur visibilitas profil publik tim.

### Journey 2 — Captain Kelola Scrim
1. Captain buka workspace tim → tab Scrim → "Tambah Scrim".
2. Isi: tanggal, waktu, tim lawan, format (BO1/BO3), lokasi (server/room).
3. Sistem otomatis kirim notifikasi WA ke semua Member divisi tersebut.
4. Captain pantau konfirmasi hadir secara real-time.
5. Setelah scrim: Captain input skor → sistem simpan ke scrim_results → statistik win/loss diperbarui.

### Journey 3 — Member Konfirmasi Hadir
1. Member terima notifikasi WA: "Scrim vs Team X besok jam 20.00. Konfirmasi: [link]".
2. Member klik link → redirect ke workspace (auto-login jika sudah pernah login).
3. Tampil card scrim dengan tombol **Hadir / Tidak Hadir / Ragu**.
4. Pilih → sistem update status → Captain lihat di dashboard secara real-time.
5. Selesai dalam < 30 detik.

---

## Success Metrics / KPI

| Metrik | Target (3 bulan post-launch) |
|---|---|
| Tim terdaftar | 100+ organisasi aktif |
| Member aktif (DAU/MAU) | > 40% |
| Scrim dikonfirmasi via platform | > 70% (bukan WA manual) |
| Waktu setup organisasi baru | < 5 menit |
| Notifikasi WA terkirim sukses | > 95% delivery rate |
| Churn rate (bulan ke-2) | < 20% |
| NPS Captain/Owner | > 50 |

---

## Out of Scope untuk MVP

- Live streaming / VOD library (Phase 3)
- AI-assisted performance insights (Phase 3)
- Sistem monetisasi / marketplace sponsor (Phase 3)
- Mobile native app (iOS/Android) — web mobile-responsive dulu
- Integrasi langsung dengan game API (Riot, Moonton) — manual input dulu
- Sistem tournament bracket builder internal — integrasi eksternal (Challonge) mungkin Phase 2
- Chat/messaging internal (Discord sudah ada, jangan duplikasi dulu)
- Multi-bahasa (English) — Bahasa Indonesia dulu
