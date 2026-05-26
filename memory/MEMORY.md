# MEMORY.md — Index
> One line per entry. Read this first, then open relevant files only.
> Last updated: 2026-05-27

## user
- [[user-developer-profile]] — Ichsan Junaedi, Indonesian solo dev, Bahasa Indonesia UI, prefers premium dark UI, concise responses, per-category commits

## project
- [[project-hyperion-overview]] — Esports OS for MLBB team, Next.js 15 + Supabase, solo dev, OWNER_EMAIL detection, project ID pqzdukrlmbwjjgjyoqva, source of truth: CLAUDE.md + progress.md
- [[project-scrim-domain-rules]] — Owner excluded from salary, two VOD concepts (vod_link vs vod_timestamps), canManageScrims excludes coach so add isCoach separately
- [[project-feature-planning-style]] — Plan first (confirm scope), then full implementation including migration + typecheck + commit; user simplifies scope mid-plan, just comply

## feedback
- [[feedback-webpack-hmr-fix]] — Next.js 15 HMR crash fix: always use `const X = ...; export { X }` never `export function` or `export default function`
- [[feedback-supabase-workflow]] — `npx supabase` (not bare `supabase`), repair commands for migration conflicts, project ID pqzdukrlmbwjjgjyoqva, manual types edit when gen fails
- [[feedback-git-workflow]] — Stage specific files per category, rtk commit preferred (fallback git commit if not in PATH), always push after commit, never `git add .`
- [[feedback-ui-design-preferences]] — No border on role badges/pills, no leading zeros in number inputs, NumberInput component required, hero portrait circular pattern, justify-between for name+role dropdowns

## reference
- [[reference-key-locations]] — Where to find: DB types, reusable components, scrim files, salary files, analytics files, permission utilities
