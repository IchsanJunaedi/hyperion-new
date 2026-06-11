-- Per-game AI tactical review (Draft vs Execution) for scrims
CREATE TABLE IF NOT EXISTS scrim_ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id uuid NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  game_number integer NOT NULL,
  narrative text NOT NULL,
  scoreboard jsonb,
  draft jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scrim_id, game_number)
);

ALTER TABLE scrim_ai_reviews ENABLE ROW LEVEL SECURITY;

-- Active org members can read reviews for scrims in their org
CREATE POLICY "scrim_ai_reviews_read_members"
  ON scrim_ai_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM scrims s
      JOIN team_members tm ON tm.organization_id = s.organization_id
      WHERE s.id = scrim_ai_reviews.scrim_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Writes go through the service-role admin client (bypasses RLS); no INSERT/UPDATE policy needed.
