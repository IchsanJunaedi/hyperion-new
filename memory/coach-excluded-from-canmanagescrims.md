---
name: coach-excluded-from-canmanagescrims
description: canManageScrims does NOT include coach — must add isCoach separately for coach access
type: feedback
---

# Coach vs canManageScrims — Non-Obvious Gotcha

## The Bug Pattern
Di `app/[team-slug]/(workspace)/scrim/[id]/page.tsx`:
```ts
const canManageScrims = ["captain", "manager", "owner"].includes(currentUserRole ?? "");
const isCoach = currentUserRole === "coach";
```

`canManageScrims` sengaja **tidak** include coach. Coach punya akses berbeda.

## How This Burned Us
Saat buat `ScrimVodLinkSection`, prop `canEdit` hanya diberi `canManageScrims` — coach tidak bisa edit. Ichsan langsung tanya: "itu allowednya cuma manajer coach dan captain kan?" — yang berarti coach harusnya bisa.

## Correct Pattern Untuk Fitur yang Coach Boleh Akses
```tsx
// visibility: tampil jika ada data ATAU user bisa edit
{(data || canManageScrims || isCoach) && (
  <Component canEdit={canManageScrims || isCoach} />
)}
```

## Rule of Thumb
Setiap kali ada fitur baru di scrim: tanya dulu siapa yang boleh edit. Jawaban default untuk scrim coaching tools = Coach + Captain + Manager + Owner.
