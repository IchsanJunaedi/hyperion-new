-- Calendar event RSVPs: members can confirm/decline attendance on calendar events
CREATE TABLE IF NOT EXISTS calendar_event_rsvps (
  event_id    uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id)       ON DELETE CASCADE,
  status      text NOT NULL CHECK (status IN ('hadir', 'tidak_hadir', 'tentative')),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE calendar_event_rsvps ENABLE ROW LEVEL SECURITY;

-- Members can upsert their own RSVP
CREATE POLICY "Users manage own rsvp"
  ON calendar_event_rsvps
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Everyone authenticated can read RSVPs (for showing counts)
CREATE POLICY "Authenticated can read rsvps"
  ON calendar_event_rsvps FOR SELECT
  USING (auth.role() = 'authenticated');
