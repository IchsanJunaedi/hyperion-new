---
name: project-feature-planning-style
description: How the user prefers to plan features — plan first, confirm, then implement
type: project
---

# Feature Planning Style

## User Preference
User wants a **plan/proposal FIRST** for larger features before implementation begins.

Example prompt: "buatkan plannya dulu biar rapih" (make the plan first so it's neat)

## Plan Format That Works
- Markdown artifact with clear sections
- Table of files to create/edit
- DB migration SQL shown in plan (not executed yet)
- Ask one clarifying question at the end (e.g. "should I run db push?")
- Keep plan concise — not too long

## When User Refines the Plan
User will clarify scope mid-plan. Immediately adjust:
- Example: "engga buat 1 form link scrim aja" → simplified from multi-link table to single column
- Don't argue or explain why the original plan was better
- Just implement the simplified version

## Implementation After Plan
Once plan is approved (or refined), execute ALL steps including:
- Migration + `npx supabase db push`
- Type updates in `types/database.ts`
- Server actions
- UI components
- Page integration
- `npm run typecheck` to verify
- Git commit + push
