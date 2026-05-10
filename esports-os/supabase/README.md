# `supabase/` — runbook

Database migrations and Edge Functions for the EsportsOS project.

## Layout

```
supabase/
├── config.toml                          ← Supabase CLI config (incl. JWT hook)
├── migrations/
│   ├── 20260510000001_init_schema.sql   ← enums, tables, indexes, triggers
│   ├── 20260510000002_rls_helpers.sql   ← is_member_of / get_member_role / is_captain_or_above
│   ├── 20260510000003_rls_policies.sql  ← RLS on every public table
│   ├── 20260510000004_jwt_hook.sql      ← custom_access_token_hook → app_metadata.organizations
│   ├── 20260510000005_storage_buckets.sql ← org-logos / org-private / avatars + policies
│   └── 20260510000006_wa_queue_cron.sql ← pg_cron + pg_net → Edge Function trigger
└── functions/
    └── process-wa-queue/
        ├── index.ts                      ← Deno Edge Function: drains pending WA notifications
        └── deno.json                     ← import map
```

Migration files are named with sortable timestamps so the Supabase CLI
applies them in the intended order.

## First-time apply (production project)

Project ref is already wired up in `config.toml` (`tbuxtlbtjpoholcflmoy`).

```bash
# 1. Install / update the Supabase CLI
npm install -D supabase    # or: brew install supabase/tap/supabase

# 2. Link this folder to the cloud project
cd esports-os
npx supabase login
npx supabase link --project-ref tbuxtlbtjpoholcflmoy

# 3. Apply migrations
npx supabase db push

# 4. Set Vault secrets used by the cron trigger (one-off SQL, run in
#    the SQL editor in the Supabase dashboard)
SELECT vault.create_secret('https://tbuxtlbtjpoholcflmoy.supabase.co', 'project_url');
SELECT vault.create_secret('<paste service role key>',                 'service_role_key');

# 5. Deploy the Edge Function + secrets
npx supabase functions deploy process-wa-queue
npx supabase secrets set FONNTE_API_TOKEN=<paste fonnte device token>

# 6. Enable the JWT hook in the dashboard
#    Auth → Hooks → Customize Access Token (JWT) Claims hook
#    → choose `public.custom_access_token_hook`
#    (already declared in config.toml so `db push` keeps it in sync)
```

## Regenerate TypeScript types

After any schema change:

```bash
cd esports-os
npm run db:types        # writes to types/database.ts
```

## Local dev (optional)

`npx supabase start` boots a local Postgres + Studio + Edge runtime on
ports defined in `config.toml`. Migrations apply automatically. Use
`npx supabase functions serve process-wa-queue --env-file ./functions/.env`
to run the function locally — it'll hit your local Postgres.

## Things deliberately not in migrations

- **The service-role key and Fonnte token** — both live in Supabase
  Vault (cron) and Edge Function secrets, never committed.
- **Seed data** — none needed yet; org/member rows are created via the
  app onboarding flow in Step 3.
- **Row-level test fixtures** — added once we wire up integration tests
  in Step 6 (scrim management) where they're actually exercised.
