-- Set default value for show_on_schedule to true
ALTER TABLE public.tournaments ALTER COLUMN show_on_schedule SET DEFAULT true;

-- Update existing tournaments to show on schedule by default
UPDATE public.tournaments SET show_on_schedule = true;
