-- Match results within tournament stages
CREATE TABLE IF NOT EXISTS tournament_matches (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id      uuid        NOT NULL REFERENCES tournament_stages(id) ON DELETE CASCADE,
  round_label   text        NOT NULL,           -- e.g. "Babak Grup", "Semifinal"
  our_score     integer,
  opponent_score integer,
  is_win        boolean,
  notes         text,
  played_at     timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read matches"
  ON tournament_matches FOR SELECT
  USING (auth.role() = 'authenticated');

-- Captains and above manage match results (enforced at app layer; permissive here)
CREATE POLICY "Authenticated can manage matches"
  ON tournament_matches
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX idx_tournament_matches_stage ON tournament_matches(stage_id);
