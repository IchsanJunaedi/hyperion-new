# VOD Review Timestamps — Design Spec
Date: 2026-05-26

## Overview
Add per-game VOD Review with timestamps to the scrim results page (`/scrim/[id]/results`).
Coach/Captain can annotate key moments while watching VOD recordings alongside draft context.

## Feature Description
Each game card on the results page gets a collapsible **VOD Review** accordion.
Timestamps are scoped per-game (Game 1, Game 2, etc.) and show:
- Time in MM:SS format (stored as integer seconds)
- Tagged player username (optional, from draft picks participants)
- Note text (free text annotation)

## Placement Decision
Inline accordion per game card — NOT a separate page.
Rationale: Coach needs draft picks visible (who played what hero) while reviewing VOD.
A separate page would require context-switching. Inline keeps both visible simultaneously.

## Role Access
| Action | Who |
|--------|-----|
| View timestamps | All team members |
| Add timestamp | Coach + Captain |
| Delete own timestamp | Coach + Captain |
| Delete any timestamp | Coach only |

## Database

### New Table: `scrim_vod_timestamps`
```sql
id               uuid PK default gen_random_uuid()
scrim_id         uuid NOT NULL FK scrims(id) ON DELETE CASCADE
game_number      int NOT NULL
timestamp_secs   int NOT NULL        -- e.g. 754 = "12:34"
tagged_player_id uuid FK auth.users(id) ON DELETE SET NULL (nullable)
note             text NOT NULL
created_by       uuid NOT NULL FK auth.users(id) ON DELETE CASCADE
created_at       timestamptz NOT NULL default now()
```

### RLS Policies
- SELECT: any active team member of the scrim's org
- INSERT: coach or captain of the org, `created_by = auth.uid()`
- DELETE: `created_by = auth.uid()` OR coach of the org

## Components

### `VodReviewSection.tsx` (Client Component)
Props:
- `scrimId: string`
- `gameNumber: number`
- `initialTimestamps: VodTimestampRow[]`
- `players: { userId: string; displayName: string }[]` — from draft picks (our side, player_id not null)
- `canEdit: boolean` — true if coach or captain
- `currentUserId: string`
- `isCoach: boolean` — true if coach (can delete any)

Behavior:
- Accordion expand/collapse with count badge in header
- Timestamp list sorted by `timestamp_secs` ascending
- Add form: MM:SS text input + player dropdown + note textarea
- Delete: X button per row (visible to creator or coach)
- Optimistic UI updates (no full page reload)

## Data Flow (Results Page — Server)
1. Fetch `scrim_vod_timestamps` for scrim_id, grouped by game_number
2. Fetch `profiles.display_name` for all `player_id` values in `scrim_draft_picks`
3. Check current user role from `team_members` → derive `canEdit`, `isCoach`
4. Pass per-game data to `VodReviewSection` as props

## Server Actions (`features/scrim/actions/vodTimestampsAction.ts`)
- `addVodTimestampAction(scrimId, gameNumber, timestampSecs, taggedPlayerId, note)`
  - Returns `{ ok: true; timestamp: VodTimestampRow } | { ok: false; message: string }`
- `deleteVodTimestampAction(timestampId)`
  - Returns `{ ok: true } | { ok: false; message: string }`
