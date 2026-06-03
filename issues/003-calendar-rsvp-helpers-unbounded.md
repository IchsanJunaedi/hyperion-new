# Helper RSVP & komentar kalender tanpa `.limit()` (unbounded)

**Labels:** `performance`, `query-rules`, `calendar`
**Priority:** 🟡 Low–Medium
**Status:** Belum dikerjakan

## Summary
Beberapa helper di `features/calendar/queries.ts` mengambil baris dari tabel yang bisa tumbuh tanpa `.limit()`. Sebagian besar per-event jadi dampaknya terbatas, tapi tetap melanggar CLAUDE.md Query Rule #1 dan beberapa juga tanpa error handling (Rule #5).

## Location & rincian
`features/calendar/queries.ts`:

1. **`getRsvpAttendees` (baris ~226-239)** — `calendar_event_rsvps` + join `profiles`, tanpa `.limit()` dan tanpa cek `error`.
2. **`getRsvpCounts` (baris ~197-215)** — `calendar_event_rsvps` per event, tanpa `.limit()` dan tanpa cek `error`.
3. **`getEventComments` (baris ~244-257)** — `calendar_event_comments` per event, tanpa `.limit()` dan tanpa cek `error`.
4. **Detail event (baris ~117-130)** — `calendar_event_comments` & `calendar_event_relations` di `getEventDetail`, tanpa `.limit()`.

> Catatan: `getRsvpCountsForEvents` (batch grid count) sudah benar — punya `.limit(10000)` dan menghindari N+1. Jangan diubah.

## Impact
- Event dengan RSVP/komentar sangat banyak bisa transfer baris berlebihan.
- Error query tertelan diam-diam (tidak ada `console.error`).
- Prioritas rendah karena scope per-event (bukan global), tapi murah untuk diperbaiki.

## Proposed Fix
Tambahkan `.limit()` wajar (mis. RSVP `.limit(200)`, komentar `.limit(200)`, relations `.limit(50)`) dan destructure + cek `error` di tiap helper. Contoh:
```ts
const { data, error } = await (supabase as any)
  .from("calendar_event_rsvps")
  .select("user_id, status, profiles(full_name, display_name)")
  .eq("event_id", eventId)
  .limit(200);
if (error) console.error("getRsvpAttendees:", error);
```

## Acceptance Criteria
- [ ] Keempat helper di atas punya `.limit()`.
- [ ] Tiap helper destructure `error` + `console.error`.
- [ ] `getRsvpCountsForEvents` tetap tidak diubah.
