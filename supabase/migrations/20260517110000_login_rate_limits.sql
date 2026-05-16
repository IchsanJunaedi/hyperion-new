create table if not exists public.login_rate_limits (
  identifier   text        primary key,           -- email (lowercase)
  attempts     smallint    not null default 0,
  locked_until timestamptz,
  updated_at   timestamptz not null default now()
);

-- RLS enabled, no policies → only service role (admin client) can access
alter table public.login_rate_limits enable row level security;

-- Auto-purge stale records older than 2 hours (keeps table tiny)
create index if not exists login_rate_limits_updated_at_idx
  on public.login_rate_limits (updated_at);
