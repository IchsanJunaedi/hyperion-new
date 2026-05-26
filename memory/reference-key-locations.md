---
name: reference-key-locations
description: Where to find important files, components, patterns, and constants in the codebase
type: reference
---

# Key File Locations

## Core Config
| What | Where |
|------|-------|
| Project rules & patterns | `CLAUDE.md` |
| Feature inventory & gotchas | `progress.md` |
| DB types (manual edit when gen fails) | `types/database.ts` |
| Global styles | `app/globals.css` |
| Utility: class merging | `lib/utils/cn.ts` |
| Audit logging | `lib/audit.ts` |

## Reusable UI Components
| Component | Path |
|-----------|------|
| Number input stepper | `components/ui/number-input.tsx` |
| Custom select dropdown | `features/dashboard/components/CustomSelect.tsx` |
| Delete confirmation dialog | `features/dashboard/components/ConfirmDeleteDialog.tsx` |
| Dashboard/manage notifications | `features/dashboard/components/NotifyModal.tsx` |

## Scrim Feature
| What | Where |
|------|-------|
| Scrim queries | `features/scrim/queries.ts` |
| Scrim server actions | `features/scrim/actions.ts` |
| VOD timestamp actions | `features/scrim/actions/vodTimestampsAction.ts` |
| VOD link action | `features/scrim/actions/vodLinkAction.ts` |
| Hero list + image URL helper | `features/scrim/data/mlbb-heroes.ts` |
| Hero images (WebP) | `public/heroes/<slug>.webp` |
| Scrim detail page | `app/[team-slug]/(workspace)/scrim/[id]/page.tsx` |
| Scrim results page | `app/[team-slug]/(workspace)/scrim/[id]/results/page.tsx` |

## Analytics / Meta
| What | Where |
|------|-------|
| Player hero modal | `features/analytics/components/PlayerHeroModal.tsx` |
| Draft analytics tab | `features/analytics/components/tabs/DraftAnalyticsTab.tsx` |
| Meta page | `features/meta/components/MetaPage.tsx` |

## Salary / Contracts
| What | Where |
|------|-------|
| Salary actions | `features/salary/actions.ts` |
| Salary queries | `features/salary/queries.ts` |
| Salary form modal | `features/salary/components/SalaryFormModal.tsx` |
| Manage salaries page | `app/manage/salaries/page.tsx` |
| Dashboard salaries page | `app/dashboard/(panel)/salaries/page.tsx` |

## Permissions
| What | Where |
|------|-------|
| Current user role | `features/roster/queries.ts` → `getCurrentUserRole()` |
| Calendar permissions | `lib/permissions/` |
| API permission middleware | `lib/api/permission-middleware.ts` |
