-- =============================================================================
-- WA + Computer Vision integration (Blueprint Bab 5)
--
-- Prepares the database for the WhatsApp-based scrim screenshot flow:
--   1. Extend scrim_game_results with blueprint columns (result, our_score,
--      enemy_score, vod_timestamp). duration_seconds already exists.
--   2. Create wa_scrim_session_states for conversation state tracking.
--
-- Note: scrim_draft_picks and scrim_draft_bans already exist and are reused
-- by the WA flow. The server actions normalize the vision payload into those
-- tables — no new draft table is needed.
-- =============================================================================

-- 1. Extend scrim_game_results -----------------------------------------------

ALTER TABLE public.scrim_game_results
  ADD COLUMN IF NOT EXISTS result TEXT CHECK (result IN ('win', 'lose')),
  ADD COLUMN IF NOT EXISTS our_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enemy_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vod_timestamp TEXT;

-- Backfill result from is_win for existing rows
UPDATE public.scrim_game_results
SET result = CASE WHEN is_win THEN 'win' ELSE 'lose' END
WHERE result IS NULL;

-- 2. wa_scrim_session_states -------------------------------------------------

CREATE TABLE IF NOT EXISTS public.wa_scrim_session_states (
  phone_number          TEXT PRIMARY KEY,
  scrim_id              UUID NOT NULL REFERENCES public.scrims(id) ON DELETE CASCADE,
  current_game          INT NOT NULL DEFAULT 1 CHECK (current_game >= 1 AND current_game <= 7),
  state                 TEXT NOT NULL DEFAULT 'waiting_draft'
                        CHECK (state IN ('waiting_draft', 'waiting_scoreboard', 'waiting_confirmation')),
  temp_draft_data       JSONB,
  temp_scoreboard_data  JSONB,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_scrim_session_scrim
  ON public.wa_scrim_session_states(scrim_id);

-- RLS: service role bypasses RLS (used by webhook). Authenticated team
-- members can view their own org's sessions; captain+ can update.

ALTER TABLE public.wa_scrim_session_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wa_session_read_member" ON public.wa_scrim_session_states;
CREATE POLICY "wa_session_read_member"
  ON public.wa_scrim_session_states FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scrims s
    WHERE s.id = wa_scrim_session_states.scrim_id
    AND public.is_member_of(s.organization_id)
  ));

DROP POLICY IF EXISTS "wa_session_modify_captain" ON public.wa_scrim_session_states;
CREATE POLICY "wa_session_modify_captain"
  ON public.wa_scrim_session_states FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.scrims s
    WHERE s.id = wa_scrim_session_states.scrim_id
    AND public.is_captain_or_above(s.organization_id)
  ));

DROP POLICY IF EXISTS "wa_session_update_captain" ON public.wa_scrim_session_states;
CREATE POLICY "wa_session_update_captain"
  ON public.wa_scrim_session_states FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scrims s
    WHERE s.id = wa_scrim_session_states.scrim_id
    AND public.is_captain_or_above(s.organization_id)
  ));
