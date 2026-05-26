-- VOD Review timestamps per game in a scrim
CREATE TABLE scrim_vod_timestamps (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scrim_id         uuid NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  game_number      int NOT NULL,
  timestamp_secs   int NOT NULL,
  tagged_player_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note             text NOT NULL,
  created_by       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX scrim_vod_timestamps_scrim_id_idx ON scrim_vod_timestamps(scrim_id);

ALTER TABLE scrim_vod_timestamps ENABLE ROW LEVEL SECURITY;

-- All active members of the org can view timestamps for their scrims
CREATE POLICY "Members can view vod timestamps"
  ON scrim_vod_timestamps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scrims s
      JOIN team_members tm ON tm.organization_id = s.organization_id
      WHERE s.id = scrim_vod_timestamps.scrim_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Coach and Captain can add timestamps
CREATE POLICY "Coach and Captain can add vod timestamps"
  ON scrim_vod_timestamps FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM scrims s
      JOIN team_members tm ON tm.organization_id = s.organization_id
      WHERE s.id = scrim_vod_timestamps.scrim_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('coach', 'captain')
        AND tm.is_active = true
    )
  );

-- Creator or Coach can delete
CREATE POLICY "Creator or Coach can delete vod timestamps"
  ON scrim_vod_timestamps FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM scrims s
      JOIN team_members tm ON tm.organization_id = s.organization_id
      WHERE s.id = scrim_vod_timestamps.scrim_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'coach'
        AND tm.is_active = true
    )
  );
