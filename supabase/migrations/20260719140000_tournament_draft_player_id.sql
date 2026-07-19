ALTER TABLE public.tournament_draft_picks ADD COLUMN player_id uuid REFERENCES public.profiles(id);
