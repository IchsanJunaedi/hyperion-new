---
name: feedback-git-workflow
description: Git commit rules — per-category staging, rtk commit preferred, never git add dot
type: feedback
---

# Git Workflow Rules (confirmed 2026-05-27)

## Core Rules
- Stage specific files per commit — **never `git add .`**
- Group by category/feature — one commit per logical unit
- `rtk commit` is preferred (but may not be in PATH — fallback to `git commit`)
- Always `git push` after committing

## Commit Message Format
```
<type>(<scope>): <short description>
```
Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`

## Examples from this project
```
feat(ui): add premium NumberInput stepper and refactor all numerical forms
feat(scrim): add VOD/livestream link management to scrim detail
docs: update CLAUDE.md and progress.md to reflect state as of 2026-05-27
```

## rtk commit availability
- `rtk` tool is installed but sometimes not found in PATH during `run_command`
- If `rtk commit` fails with "program not found", use `git commit` directly — same result
- Never skip the commit step because of this

## Branch
Always `main` — solo dev project, no PRs.
