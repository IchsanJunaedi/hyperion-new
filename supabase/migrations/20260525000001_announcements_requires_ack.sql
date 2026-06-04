-- Add requires_ack flag to announcements
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS requires_ack BOOLEAN NOT NULL DEFAULT FALSE;
