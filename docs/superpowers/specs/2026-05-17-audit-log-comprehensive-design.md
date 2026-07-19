# Audit Log — Comprehensive Coverage & Dashboard Design

**Date:** 2026-05-17  
**Status:** Approved  
**Approach:** UI-first (dashboard revamp → audit coverage pass)

---

## 1. Architecture

### Data Flow

```
User Filter Input (search, module, actor, date range, action type)
       ↓
URL Search Params (?search=&module=&actor=&from=&to=&page=)
       ↓
Server Action: fetchAuditLogs({ search, filters, page, pageSize: 50 })
       ↓
Supabase Query (server-side)
  - Full-text search: action ILIKE + metadata::text ILIKE
  - Filter: entity_type, actor_id, created_at range, action prefix
  - Pagination: LIMIT 50 OFFSET (page - 1) * 50
  - COUNT(*) for total pages
       ↓
AuditLogDashboard (Client Component)
  - Activity chart (bar, 7/30 days)
  - Filter panel + saved presets
  - Results grouped by date, paginated
  - Export CSV
```

### DB Changes

No new migration needed. Add one GIN index for metadata full-text search:

```sql
CREATE INDEX idx_audit_logs_metadata_gin ON audit_logs USING GIN (metadata);
```

### State

All filter state lives in URL search params — bookmarkable and shareable.  
Saved presets stored in `localStorage` (max 5, keyed by preset name).

---

## 2. Audit Coverage

### Modules with Zero Coverage (add all CRUD)

| Module | Actions |
|--------|---------|
| `announcements` | `announcement.create`, `announcement.update`, `announcement.delete` |
| `strategy` | `strategy.create`, `strategy.update`, `strategy.delete` |
| `files` | `file.upload`, `file.delete` |
| `finances` | `finance.create`, `finance.delete` |
| `content` | `content.create`, `content.update`, `content.delete`, `content.status_change` |
| `notifications` | `wa.retry` |

### Gap Fixes in Existing Modules

| Module | Fix |
|--------|-----|
| `player-development` | Add `player_target.delete` |
| `scrim` | Audit `scrim.create`, `scrim.update`, `scrim.delete` (verify first) |
| `matchmaking` | Add `scrim_request.accept`, `scrim_request.reject` |

### Action Naming Convention

```
<module>.<operation>
Examples: announcement.create, finance.delete, content.status_change
```

### Metadata Standard

| Operation | Metadata fields |
|-----------|----------------|
| create | `{ title/name, teamId/orgId }` |
| update | `{ changes: { field: [oldValue, newValue] } }` |
| delete | `{ title/name }` (snapshot before deletion) |
| status_change | `{ from, to }` |

---

## 3. UI Dashboard

### Layout (`/app/dashboard/(panel)/audit/page.tsx`)

```
┌─────────────────────────────────────────────────────┐
│  Activity Chart (bar chart 7/30 hari terakhir)      │
│  [7 Hari] [30 Hari]                                 │
├─────────────────────────────────────────────────────┤
│  Filter Panel                                        │
│  [🔍 Search...] [Module▾] [Actor▾] [Date Range▾]   │
│  [Action Type▾]  Saved: [Preset 1] [Preset 2] [+]  │
├─────────────────────────────────────────────────────┤
│  Results: 342 aktivitas  [Export CSV]               │
│                                                      │
│  — Hari ini —                                       │
│  ● announcement.create  Ican  "Latihan besok..."    │
│  ● file.upload          Ican  roster_v2.pdf         │
│                                                      │
│  — Kemarin —                                        │
│  ● finance.create       Ican  Rp 500.000            │
│  ● member_kicked        Ican  @player123            │
│                                                      │
│  [← Prev]  Halaman 1 / 7  [Next →]                 │
└─────────────────────────────────────────────────────┘
```

### Components

**`AuditActivityChart`**
- Recharts `BarChart` (no SSR issues via dynamic import)
- Toggle 7 days / 30 days
- Clicking a bar sets date filter in URL params

**`AuditFilterPanel`**
- Search input: debounced 300ms, updates `?search=` param
- Module dropdown: maps entity_type values → human label
- Actor dropdown: fetches distinct actor_ids from recent logs
- Date range: two date inputs (from/to), Jakarta timezone aware
- Action type: create / update / delete / status / access / other
- Saved presets: localStorage, max 5, shown as dismissible pill buttons
- Preset save: names the current filter state, stores as JSON

**`AuditLogList`**
- Groups entries by date (Jakarta timezone, `date-fns`)
- Sticky date group headers
- Per-entry: color dot (action category) + action label + actor name + human-readable metadata + relative time
- Human-readable metadata per action type (not raw JSON):
  - `create` → shows title/name
  - `update` → shows "field changed: old → new"
  - `delete` → shows "deleted: name"
  - `status_change` → shows "from → to"

**`AuditPagination`**
- Prev / Next buttons + "Page X / Y"
- Updates `?page=` param

**`AuditExportButton`**
- On click: fetch ALL results for current filter (no pagination limit)
- Generate CSV client-side with columns: timestamp, actor, action, entity_type, entity_id, metadata_summary
- Filename: `audit-YYYY-MM-DD.csv`

### Color Coding (preserved from existing system)

| Category | Color | Actions |
|----------|-------|---------|
| Delete / kick | Red | `*.delete`, `member_kicked`, `member_removed` |
| Join / create | Green | `member_joined`, `user_registered` |
| Create / update | Blue | `*.create`, `*.update`, `org_updated` |
| Archive | Amber | `division_archived` |
| Role change | Purple | `role_changed` |
| Other | Gray | Everything else |

---

## 4. Implementation Order

1. **DB:** Add GIN index migration
2. **Server action:** Replace `fetchAuditLogs` with server-side search + pagination + count
3. **UI:** Build `AuditActivityChart`, `AuditFilterPanel`, `AuditLogList`, `AuditPagination`, `AuditExportButton`
4. **Audit coverage:** Add `logAudit` to all 6 missing modules + fix gaps
5. **Action labels:** Extend label map in `AuditLogList` for all new action types
6. **Commit & push**

---

## 5. Out of Scope

- PDF export
- Email digest of audit logs
- Per-team audit log (current: org-wide only)
- Audit log retention policy / auto-purge
