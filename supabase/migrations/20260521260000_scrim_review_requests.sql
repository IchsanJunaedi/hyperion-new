-- Formal scrim review requests: captains/members request coach feedback on a scrim
CREATE TABLE IF NOT EXISTS scrim_review_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id      uuid        NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  requested_by  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes         text,
  status        text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  review_notes  text,
  reviewed_at   timestamptz,
  reviewed_by   uuid        REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scrim_id)  -- one review request per scrim
);

ALTER TABLE scrim_review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read review requests"
  ON scrim_review_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create review request"
  ON scrim_review_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Coach can update review"
  ON scrim_review_requests FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_scrim_review_scrim ON scrim_review_requests(scrim_id);
