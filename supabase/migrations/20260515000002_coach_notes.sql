ALTER TABLE public.scrim_results
  ADD COLUMN IF NOT EXISTS coach_notes TEXT;
