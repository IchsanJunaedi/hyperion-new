-- Migration: Add calendar_id reference to calendar_events
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS calendar_id UUID REFERENCES calendar_configs(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_id ON calendar_events(calendar_id);
