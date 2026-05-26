---
name: feedback-supabase-workflow
description: Supabase db push workflow including repair commands for migration history conflicts
type: feedback
---

# Supabase DB Push Workflow (confirmed 2026-05-27)

## Normal Push
```bash
npx supabase db push
```
Will prompt `[Y/n]` — it auto-accepts in CI but requires input in dev.

## When Push Fails: "Remote migration versions not found in local"
Remote has migrations not tracked locally. Fix:
```bash
npx supabase migration repair --status reverted <version1> <version2>
npx supabase db push
```

## When Migration Already Applied Remotely
```bash
npx supabase migration repair --status applied <version>
npx supabase db push
```

## Type Generation
```bash
npx supabase gen types typescript --project-id pqzdukrlmbwjjgjyoqva --schema public > types/database.ts
```
**Project ID**: `pqzdukrlmbwjjgjyoqva` (the old ID `tbuxtlbtjpoholcflmoy` is wrong/stale)

If gen fails ("Resource has been removed"): edit `types/database.ts` manually — add the new column to Row, Insert, and Update sections of the affected table.

## `supabase` binary
Not in PATH. Always use `npx supabase`, never bare `supabase`.

## Docker not running
`npx supabase gen types --local` requires Docker Desktop. Use `--project-id` flag instead for remote gen.
