# Hyperion OS — Audit Peningkatan Fitur
**Tanggal audit:** 2026-05-25  
**Scope:** 15 fitur production-ready, diaudit dari perspektif client (owner, manager, coach, captain, member)  
**Status:** Sedang dikerjakan

---

## Status Pengerjaan

| Prioritas | Total | Selesai | Sisa |
|-----------|-------|---------|------|
| 🔴 Critical bugs | 6 | 0 | 6 |
| 🟠 High (missing features) | 17 | 0 | 17 |
| 🟡 Medium (UX buruk) | 13 | 0 | 13 |
| 🟢 Quick wins | 10 | 0 | 10 |
| ✨ Wow factors | 15 | 0 | 15 |

---

## 🔴 CRITICAL — Bug nyata / fitur yang broken

- [ ] **[Dev] Player Development** — `canManage` salah di `/development`, member bisa update level target sendiri. Fix: hardcode `canManage={false}` di self-view halaman member (`app/[team-slug]/(workspace)/development/page.tsx`).
- [ ] **[Trials] Validasi social_media** — wajib di server (`!socialMedia`) tapi tidak ada tanda `*` di form publik. Pendaftar dapat error misterius. Fix: tambah `*` di label field di `TrialRegistrationForm.tsx`.
- [ ] **[Files] Member di-redirect** — redirect keluar untuk member, 80% anggota tidak bisa akses file. Fix: hapus redirect condition untuk member di `app/[team-slug]/(workspace)/files/page.tsx`, batas hanya upload.
- [ ] **[Announcements] Role guard hilang** — tombol hapus + pin muncul untuk semua role termasuk member. Fix: wrap `<AnnouncementActions>` dengan role check di halaman detail.
- [ ] **[Meta] `window.confirm()` + `window.location.search`** — delete pakai browser native dialog (inkonsisten), switch patch pakai `window.location.search` (full reload). Fix: ganti keduanya.
- [ ] **[Dashboard] Sidebar nama organisasi** — sidebar menampilkan `profile.full_name` (nama owner) bukan `organizations.name`. Fix: fetch dan gunakan `organizations.name` di sidebar layout.

---

## 🟠 HIGH — Fitur penting yang hilang

### Scrim
- [ ] Room ID + Password tidak bisa disimpan — info paling kritis tidak ada field-nya di `ScrimForm.tsx`
- [ ] Notifikasi ke member kalau jadwal scrim diubah — `updateScrimAction` tidak ada fan-out notifikasi

### Calendar
- [ ] `+X lagi` tidak bisa diklik — event tersembunyi di hari padat tak terjangkau (`CalendarGrid.tsx`)
- [ ] Daftar nama RSVP — hanya ada angka, tidak ada nama siapa yang hadir di `calendar/[id]`
- [ ] Visibility selector saat create event — backend sudah ada, UI tidak expose di `CalendarEventForm.tsx`

### Tournaments
- [ ] Edit match result — hanya bisa hapus, tidak bisa koreksi skor di `MatchRow`
- [ ] Timeline hanya muncul di `ongoing`/`completed` — tidak bisa lihat stages di `upcoming`

### Announcements
- [ ] Tidak ada tombol Edit — salah ketik = hapus dan buat ulang (kehilangan read count)
- [ ] Read count ambigu — "4" dari berapa? Harus tampil "4/18 dibaca"

### Strategy
- [ ] Tidak ada tombol Edit — hapus catatan = hilang semua komentar diskusi
- [ ] Tags tidak bisa diklik untuk filter — ada tag system tapi tidak fungsional

### Analytics
- [ ] Tidak ada filter waktu — win rate tidak tahu periode berapa (Last 30d / 3m / All)
- [ ] Tab "AI Insights" placeholder masih muncul di navbar

### Trials
- [ ] WA notifikasi saat status applicant berubah (accepted/rejected) — tidak ada
- [ ] Notes field per applicant tidak bisa diisi dari UI (sudah ada di DB dan actions)

### Sponsors
- [ ] Logo URL bukan file upload — tidak ada user yang tahu cara dapat direct image URL

### Notifications
- [ ] `resolveRoute` tidak handle `calendar`, `poll`, `strategy` — notifikasi tidak bisa klik ke halaman yang tepat

---

## 🟡 MEDIUM — UX buruk, terlihat amatir saat demo

### Scrim
- [ ] Tombol "Selesai Pertandingan" tidak muncul tanpa penjelasan kenapa (tidak ada placeholder info)
- [ ] W/L record tidak difilter per divisi — org multi-tim punya data tercampur

### Calendar
- [ ] Navigasi bulan = full page reload (harusnya client-side state)
- [ ] Tidak ada List/Agenda view — hanya monthly grid

### Tournaments
- [ ] Status `ongoing` dipakai untuk dua kondisi berbeda ("Terdaftar" vs "Berlangsung")

### Polls
- [ ] Setelah vote = full page reload (`revalidatePath`) — terasa tidak responsif
- [ ] Tidak ada separasi visual "Poll Aktif" vs "Poll Selesai"

### Files
- [ ] Nama file tampil dengan timestamp prefix (`1716638472000-screenshot.png`)

### Roster
- [ ] Jersey number dan position sudah di-fetch tapi tidak ditampilkan di tabel

### Meta
- [ ] `draft_notes` per hero ada di DB dan sudah di-fetch, tapi tidak pernah dirender di `HeroDetailPanel`

### Analytics
- [ ] Export PDF = `window.print()` biasa — tidak layak dikirim ke sponsor

### Dashboard
- [ ] Finance tidak ada org switcher UI — harus edit URL manual untuk ganti tim

### Notifications
- [ ] Bell hanya load 10 notifikasi, tidak ada "Lihat semua" link

---

## 🟢 QUICK WINS — Effort kecil, impact langsung

- [ ] Sembunyikan tab "AI Insights" dari Analytics — 1 baris delete dari TABS array
- [ ] Tampilkan jersey + position di RosterTable — sudah di-fetch, tinggal render
- [ ] Tampilkan `draft_notes` di HeroDetailPanel — sudah di-fetch, tinggal render satu section
- [ ] Tambah kolom "Rejected" ke stats bar Trials — satu angka tambahan di `TrialDetailClient`
- [ ] Fix `canManage` di `/development` — hardcode false di self-view (sama dengan Critical #1)
- [ ] Guard role di `AnnouncementDetail` — hanya render actions untuk manager+ (sama dengan Critical #4)
- [ ] Pisahkan "Poll Aktif" vs "Poll Selesai" — filter client-side, sudah ada datanya
- [ ] Tambah "Last Updated" di tier list Meta — pakai `activePatch.updated_at`
- [ ] Izinkan member baca Files — hapus redirect condition (sama dengan Critical #3)
- [ ] Fix nama org di sidebar dashboard — pakai `organizations.name` (sama dengan Critical #6)

---

## ✨ WOW FACTORS — Satu ide "signature" per fitur

| Fitur | Ide | Status |
|-------|-----|--------|
| Scrim | **Scouting Mode** — riwayat otomatis vs lawan yang sama: W/L history, hero picks lawan, coach notes sebelumnya | 🔜 |
| Calendar | **Weekly War Room view** — kolom Scrim/Tournament/Event untuk satu minggu + "Copy Jadwal ke WA" | 🔜 |
| Tournaments | **Visual bracket/journey** — progress turnamen sebagai bracket dengan warna W/L, cocok untuk media kit | 🔜 |
| Announcements | **"Acknowledgement Required"** — toggle wajib konfirmasi, reminder otomatis, tabel siapa sudah/belum | 🔜 |
| Strategy | **Playbook mode** — koleksi catatan dikurasi per tema, player bisa subscribe | 🔜 |
| Polls | **Availability Grid** — tipe poll khusus "siapa bisa kapan", output heatmap (seperti When2Meet) | 🔜 |
| Files | **File linked ke konteks** — attach file ke scrim/strategy/announcement tertentu | 🔜 |
| Analytics | **Player Impact Score** — satu angka 0–100 per player dari gabungan attendance + win rate + coach rating | 🔜 |
| Development | **Skill Radar Chart** — spider chart level sekarang vs target | 🔜 |
| Roster | **Roster Card mode** — toggle ke tampilan kartu pemain esports yang bisa di-screenshot | 🔜 |
| Meta | **Patch Changelog otomatis** — diff hero tier list antar patch, auto-generated | 🔜 |
| Trials | **Pipeline/Kanban view** — Pending → Dipanggil → Diterima/Waitlist/Ditolak, drag-and-drop | 🔜 |
| Dashboard | **Executive Summary** — satu halaman: win rate + sponsor value + saldo kas + attendance | 🔜 |
| Sponsors | **Sponsor ROI Dashboard** — completion rate deliverable, deal value trend, revenue projection | 🔜 |
| Notifications | **Weekly Digest** — ringkasan otomatis tiap Senin ke owner: scrims, sponsor, kas, target | 🔜 |

---

## Catatan Teknis Lintas-Fitur

- Finance tidak terintegrasi dengan sponsor — `deal_value` dan kategori "Sponsor" di finance tidak terhubung otomatis
- Salary/Payroll tidak terhubung ke Finance — gaji tidak otomatis jadi pengeluaran di finance
- Logo org di sidebar mengambil `profile.avatar_url` (avatar owner), bukan `organizations.logo_url`
- Semua grid dan tabel menggunakan lebar fixed — tidak mobile-friendly
- `window.confirm()` dipakai di Meta, Trials, Sponsors — harus diganti `ConfirmDeleteDialog`
