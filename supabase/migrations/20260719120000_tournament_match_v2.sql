-- =============================================================================
-- Tournament Match V2
-- Adds: match_format, scheduled_at, opponent_id columns to tournament_matches
-- Creates: tournament_game_results (per-game results within BO format)
--          tournament_draft_picks  (hero picks per game, mirror scrim_draft_picks)
-- =============================================================================

-- Extend tournament_matches with new optional fields
ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS match_format    TEXT,         -- BO1/BO3/BO5/BO7
  ADD COLUMN IF NOT EXISTS scheduled_at   TIMESTAMPTZ,  -- waktu match spesifik (override stage)
  ADD COLUMN IF NOT EXISTS opponent_id    TEXT;          -- ID tim lawan dari platform eksternal

-- =============================================================================
-- tournament_game_results: per-game result dalam satu BO match
-- Contoh: BO3 → bisa ada game_number 1, 2, 3
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tournament_game_results (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_match_id   uuid        NOT NULL REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  game_number           integer     NOT NULL CHECK (game_number >= 1),
  is_win                boolean,
  our_score             integer,
  opponent_score        integer,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_match_id, game_number)
);

ALTER TABLE public.tournament_game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read tournament game results"
  ON public.tournament_game_results FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage tournament game results"
  ON public.tournament_game_results
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_tournament_game_results_match
  ON public.tournament_game_results (tournament_match_id);

-- =============================================================================
-- tournament_draft_picks: hero picks per game, persis seperti scrim_draft_picks
-- side: 'our' = tim kita, 'opponent' = tim lawan
-- pick_type: 'pick' | 'ban'
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tournament_draft_picks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_result_id  uuid        NOT NULL REFERENCES public.tournament_game_results(id) ON DELETE CASCADE,
  hero_name       text        NOT NULL,
  side            text        NOT NULL CHECK (side IN ('our', 'opponent')),
  pick_type       text        NOT NULL CHECK (pick_type IN ('pick', 'ban')),
  role            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_draft_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read tournament draft picks"
  ON public.tournament_draft_picks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage tournament draft picks"
  ON public.tournament_draft_picks
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_tournament_draft_picks_game
  ON public.tournament_draft_picks (game_result_id);
