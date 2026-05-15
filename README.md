# EsportsOS — `esports-os/`

Next.js 15 (App Router) workspace for [hyperionteam.id](https://hyperionteam.id).
Replaces the Laravel + Inertia stack that lives in the parent directory.

## Stack

| Layer            | Tool                                                    |
| ---------------- | ------------------------------------------------------- |
| Framework        | Next.js 15 (App Router) + React 19 + TypeScript strict  |
| Styling          | Tailwind CSS v4 + shadcn/ui (new-york) + Lucide icons   |
| Backend          | Supabase (Postgres + Auth + Storage + Realtime)         |
| Server state     | TanStack Query v5                                       |
| UI state         | Zustand                                                 |
| Forms            | React Hook Form + Zod                                   |
| WhatsApp         | [Fonnte](https://fonnte.com) (queued via Edge Function) |
| Hosting          | Vercel (with custom-domain support for tier Pro)        |

## Folder structure

```
esports-os/
├── app/
│   ├── (public)/        ← visitor landing + public team profile
│   ├── (auth)/          ← /login, /register, /callback
│   ├── (app)/           ← /[team-slug]/...  workspace (auth-gated)
│   └── api/webhooks/    ← Fonnte + Supabase webhooks
├── components/
│   ├── ui/              ← shadcn/ui primitives
│   ├── layout/          ← WorkspaceSidebar, Topbar, MobileBottomNav
│   ├── shared/          ← AvatarGroup, EmptyState, ...
│   └── providers/       ← QueryProvider (TanStack Query)
├── features/            ← feature-sliced (scrim/, roster/, ...)
├── lib/
│   ├── supabase/        ← client.ts, server.ts, middleware.ts, admin.ts
│   ├── utils/           ← cn, format, slug
│   ├── validations/     ← zod schemas
│   └── fonnte/          ← WhatsApp client + templates
├── stores/              ← Zustand
├── types/               ← database.ts (auto-gen), jwt.ts
└── middleware.ts        ← auth + custom-domain resolver
```

## Local development

```bash
cd esports-os
cp .env.example .env.local   # then fill the missing service-role / Fonnte secrets
npm install
npm run dev                  # http://localhost:3000
```

## Scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start the dev server                                |
| `npm run build`     | Production build                                    |
| `npm run lint`      | ESLint                                              |
| `npm run typecheck` | `tsc --noEmit` (strict mode)                        |
| `npm run db:types`  | Regenerate `types/database.ts` from Supabase schema |

## Environment variables

See [`.env.example`](./.env.example). Anything prefixed with `NEXT_PUBLIC_`
is exposed to the browser; everything else is server-only.

`SUPABASE_SERVICE_ROLE_KEY` must be set for:

- middleware custom-domain resolution
- Edge Function — WhatsApp queue processor
- invite acceptance route
- any Server Action that needs to bypass RLS

## Migration phases

This repo is being migrated step-by-step. The current phase is tracked in
`new-project/05_mvp_priority.md`. Step 1 (project setup) is complete; the
landing page rebuild lives in Step 4.
