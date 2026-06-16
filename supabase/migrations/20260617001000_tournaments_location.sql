-- Add location fields to tournaments table
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS location_type TEXT CHECK (location_type IN ('online', 'offline'));
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS location TEXT;
