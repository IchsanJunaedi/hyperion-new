-- Migration: Add event visibility to calendar_events
ALTER TABLE calendar_events 
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'all'
CHECK (visibility IN ('private', 'management', 'coach_up', 'all'));

-- Create index for query performance
CREATE INDEX idx_calendar_events_visibility ON calendar_events(visibility);
CREATE INDEX idx_calendar_events_org_visibility ON calendar_events(organization_id, visibility);
