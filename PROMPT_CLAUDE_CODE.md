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

**Urutan pengerjaan (dari yang paling cepat & minim risiko):**

1. **#2 — Player True Impact Score** (XS, <1 jam)
   - Buka `features/analytics/components/tabs/PlayerStatsTab.tsx`
   - Sesuaikan fungsi `computeImpactScore` untuk menggunakan nilai rata-rata rating coach riil secara proporsional.

2. **#3 — Respect Ban Tracker** (S, 2-3 jam)
   - Buat query `getRespectBans(orgId)` di `features/analytics/queries.ts`
   - Render top 5 hero ter-ban oleh lawan di dashboard.

3. **#1 — Rapor Pribadi (Player Performance View)** (S, half day)
   - Buat page/tab baru `/performance` khusus player untuk melihat evaluasi coach.
   - Gunakan query filter `user_id = auth.uid()` pada `scrim_attendances`.

4. **#4 — VOD Mistake Heatmap** (S, half day)
   - Kelompokkan timestamp VOD di `VodReviewSection.tsx` ke dalam fase early/mid/late.
   - Buat heatmap bar atau visualisasi sederhana.

5. **#5 — Draft Archetype Win Rate** (M, 1-2 hari)
   - Terapkan rule-based classification pada picks tim di `queries.ts` / `computations.ts`.
   - Hitung win rate masing-masing archetype komposisi tim dan tampilkan di Draft Analytics.

---

**Aturan wajib sebelum commit (dari CLAUDE.md):**
- Jalankan: `npm run lint` → harus 0 error
- Jalankan: `npm run typecheck` → harus exit 0
- Jalankan: `npm run test:unit:coverage` → semua pass + threshold terpenuhi
- Commit pakai `rtk commit` (JANGAN `git commit` manual)

**Mulai dari fitur #2 dulu.** Baca detail spesifikasi lengkapnya di `backlog.md` sebelum coding.
```
