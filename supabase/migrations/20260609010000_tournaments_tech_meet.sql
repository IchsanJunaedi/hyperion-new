-- Add tech meeting fields to tournaments table
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS tech_meet_date date,
  ADD COLUMN IF NOT EXISTS tech_meet_time time,
  ADD COLUMN IF NOT EXISTS tech_meet_link text;
