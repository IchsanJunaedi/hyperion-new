alter table public.open_trials
  add column division_id uuid references public.divisions(id) on delete set null;

create index on public.open_trials (division_id);
