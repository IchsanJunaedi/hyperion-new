---
name: project-scrim-domain-rules
description: Business logic rules for scrims — who gets salary, VOD concepts, permission boundaries
type: project
---

# Scrim Domain Rules

## Salary / Contract
- **Owner is excluded from salary contracts** — they receive a share of overall revenue, not a salary
- Filter: `eligibleMembers = members.filter(m => m.role !== 'owner')`
- Correction source: "kenapa dia ngegaji ownernya sendiri? harusnya gaada dong"

## VOD — Two Separate Concepts (DO NOT confuse)

### 1. `scrims.vod_link` (single URL per scrim)
- Component: `ScrimVodLinkSection` (`features/scrim/components/ScrimVodLinkSection.tsx`)
- Placement: scrim detail page (`/scrim/[id]`), below "Detail Tambahan" section in left column
- One link per scrim (full match recording or livestream)
- Edit permission: Coach, Captain, Manager, Owner (`canManageScrims || isCoach`)
- Auto-detects platform: YouTube, TikTok, Twitch, Nimo TV, Generic
- Migration: `20260527000002_scrim_vod_link.sql`

### 2. `scrim_vod_timestamps` (many per game per scrim)
- Component: `VodReviewSection` (`features/scrim/components/VodReviewSection.tsx`)
- Placement: results page (`/scrim/[id]/results`), inside each game result card
- Timestamp annotations at specific moments in video (coach review notes)
- Migration: `20260526120000_scrim_vod_timestamps.sql`

## `canManageScrims` vs `isCoach`
```typescript
const canManageScrims = ["captain", "manager", "owner"].includes(currentUserRole ?? "");
const isCoach = currentUserRole === "coach";
```
Coach is NOT included in `canManageScrims` — must add `isCoach` separately when coach needs access.
If a feature should allow coach: `canEdit={canManageScrims || isCoach}`

## Draft Picks
`scrim_draft_picks` — hero picks per game per side (our/enemy), with role and player_id.
Hero portraits use `getHeroImageUrl()` from `@/features/scrim/data/mlbb-heroes`.
