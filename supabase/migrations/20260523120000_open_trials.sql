-- supabase/migrations/20260523120000_open_trials.sql

create table public.open_trials (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  title          text not null,
  game           text not null,
  positions      text[] not null default '{}',
  status         text not null default 'draft'
                   check (status in ('draft', 'active', 'closed')),
  public_token   uuid not null unique default gen_random_uuid(),
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.trial_applicants (
  id              uuid primary key default gen_random_uuid(),
  trial_id        uuid not null references public.open_trials(id) on delete cascade,
  name            text not null,
  ign             text not null,
  phone           text not null,
  email           text not null,
  role_applied    text not null,
  rank            text not null,
  server          text not null,
  main_game       text not null,
  secondary_game  text,
  is_free_agent   boolean not null default true,
  age             integer not null,
  social_media    text,
  status          text not null default 'pending'
                    check (status in ('pending', 'accepted', 'rejected', 'waitlisted')),
  notes           text,
  created_at      timestamptz not null default now()
);

create index on public.open_trials (org_id);
create index on public.open_trials (public_token);
create index on public.trial_applicants (trial_id);
create index on public.trial_applicants (status);

alter table public.open_trials enable row level security;
alter table public.trial_applicants enable row level security;

create policy "public can read active trials by token"
  on public.open_trials for select
  using (status = 'active');

create policy "public can register as applicant"
  on public.trial_applicants for insert
  with check (true);
