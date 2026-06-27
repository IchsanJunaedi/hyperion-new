-- Update location_type check constraint to include 'hybrid'
ALTER TABLE public.tournaments
DROP CONSTRAINT IF EXISTS tournaments_location_type_check;

ALTER TABLE public.tournaments
ADD CONSTRAINT tournaments_location_type_check CHECK (location_type IN ('online', 'offline', 'hybrid'));
