# Issue Backlog — Audit 2026-06-03

> Dikumpulkan oleh Claude Code lewat audit kode penuh (fokus: **bug & correctness** + **performance**).
> Belum ada satupun yang dikerjakan. Review dulu, baru tentukan mana yang di-ACC untuk dikerjakan.
> Semua file di folder ini hanya catatan issue — tidak ada file/kode project yang diubah/dihapus.

## Cara baca
Tiap file = 1 issue, format mirip GitHub issue (Title, Labels, Priority, Summary, Location, Evidence, Impact, Proposed Fix, Acceptance Criteria).

## Daftar Issue

> Sudah di-push ke GitHub (`IchsanJunaedi/hyperion-new`) sebagai issue #19–#24.

| # | GH | Judul | Tipe | Prioritas | Status verifikasi |
|---|----|-------|------|-----------|-------------------|
| [001](001-createAchievement-empty-org-id.md) | [#19](https://github.com/IchsanJunaedi/hyperion-new/issues/19) | `createAchievement` insert `""` ke kolom `organization_id` (UUID NOT NULL) → buat achievement dari admin selalu gagal | Bug / Correctness | 🔴 High | ✅ Terverifikasi (schema + form) |
| [002](002-listApplicants-unbounded-query.md) | [#20](https://github.com/IchsanJunaedi/hyperion-new/issues/20) | `listApplicants()` tanpa `.limit()` — query unbounded di tabel yang tumbuh | Performance | 🟠 Medium | ✅ Terverifikasi |
| [003](003-calendar-rsvp-helpers-unbounded.md) | [#21](https://github.com/IchsanJunaedi/hyperion-new/issues/21) | Helper RSVP/komentar kalender tanpa `.limit()` (getRsvpAttendees, getRsvpCounts, getEventComments, detail event) | Performance | 🟡 Low–Medium | ✅ Terverifikasi |
| [004](004-select-star-on-growable-tables.md) | [#22](https://github.com/IchsanJunaedi/hyperion-new/issues/22) | `select("*")` masih dipakai di list view tabel yang tumbuh (padahal B2-2 ditandai "Done") | Performance | 🟠 Medium | ✅ Terverifikasi |
| [005](005-single-vs-maybeSingle.md) | [#23](https://github.com/IchsanJunaedi/hyperion-new/issues/23) | `.single()` dipakai luas (±80 lokasi) — langgar query rule #4, risiko throw PGRST116 tak tertangani | Correctness / Robustness | 🟠 Medium | ✅ Terverifikasi |
| [006](006-generateMonthlyReport-waterfall.md) | [#24](https://github.com/IchsanJunaedi/hyperion-new/issues/24) | `generateMonthlyReport` ~7 round-trip serial (waterfall) — backlog M3 / B2-9 | Performance | 🟢 Low (reports belum publik) | ✅ Terverifikasi (sesuai progress.md) |

## Catatan saat audit (yang TIDAK jadi issue)
- `getRsvpAttendees` sempat dicurigai pakai kolom `profiles.full_name` yang tidak ada — **ternyata ada** (ditambah migration `20260514000001_profile_extended.sql`). Bukan bug.
- `lib/data/gallery.ts` yang terhapus (git status `D`) sudah digantikan tabel `gallery_entries` (migration `20260602000001_public_cms.sql`). Tidak ada import yang rusak. Aman.
- Semua `channel.subscribe()` (AttendanceTracker, AttendanceList, StrategyComments) sudah punya `removeChannel` cleanup. Aman.
- `getRsvpCountsForEvents` (batch grid count) sudah benar — menghindari N+1, sudah `.limit()`. Aman.
