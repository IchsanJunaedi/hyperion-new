---
name: project-hyperion-overview
description: Core project identity — esports OS for Indonesian team, solo dev, tech stack, key constraints
type: project
---

# Hyperion — Esports OS

## What it is
Platform manajemen tim esports (Mobile Legends) untuk satu organisasi. Multi-role: Owner → Manager → Coach → Captain → Member.

## Key Constraints
- Solo dev project, push to `main` only
- Indonesian language UI (mostly)
- Dark Notion-style theme (#191919 bg)
- **Owner detected by `OWNER_EMAIL` env var** — never via `team_members` table
- Owner is NOT salaried (excluded from salary contract dropdowns)
- Supabase project ID: `pqzdukrlmbwjjgjyoqva`
- Next.js 15.5 App Router + TypeScript strict

## Source of Truth Files
- `CLAUDE.md` — rules, patterns, component inventory
- `progress.md` — feature inventory, tables, gotchas, what's not done

## Role Permissions (for VOD/scrim features)
- Edit VOD link: Coach, Captain, Manager, Owner
- `canManageScrims` = captain | manager | owner (NOT coach)
- `isCoach` is separate — must add both when coach needs access

## Current Test Coverage (2026-05-23)
642 unit tests, 90.4% statements / 77.9% branches — CI enforced
