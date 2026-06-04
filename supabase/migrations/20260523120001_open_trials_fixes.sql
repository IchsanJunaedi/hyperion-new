-- supabase/migrations/20260523120001_open_trials_fixes.sql
-- Fixes for 20260523120000_open_trials.sql (already applied):
-- 1. Drop redundant index on public_token (covered by UNIQUE constraint)
-- 2. Replace separate trial_id + status indexes with composite index
-- 3. Tighten insert policy — only allow applicants on active trials

-- Fix 1: Drop redundant index (UNIQUE constraint already creates one)
drop index if exists public.open_trials_public_token_idx;

-- Fix 2: Drop old separate indexes on trial_applicants
drop index if exists public.trial_applicants_trial_id_idx;
drop index if exists public.trial_applicants_status_idx;

-- Fix 2 (cont): Create composite index instead
create index on public.trial_applicants (trial_id, status);

-- Fix 3: Drop overly permissive insert policy and replace with active-trials-only check
drop policy if exists "public can register as applicant" on public.trial_applicants;

create policy "public can register as applicant"
  on public.trial_applicants for insert
  with check (
    exists (
      select 1 from public.open_trials
      where id = trial_id
        and status = 'active'
    )
  );
