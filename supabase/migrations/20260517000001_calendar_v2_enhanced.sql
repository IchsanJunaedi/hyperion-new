-- =============================================================================
-- 20260517000001_calendar_v2_enhanced.sql
-- Calendar v2: Enhanced properties, rich content, comments, recurring, relations
-- =============================================================================

-- Extend calendar_events table with new columns
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS area         TEXT,
  ADD COLUMN IF NOT EXISTS platform     TEXT,
  ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'confirmed'
                                        CHECK (status IN ('draft','confirmed','ongoing','completed','cancelled')),
  ADD COLUMN IF NOT EXISTS priority     TEXT NOT NULL DEFAULT 'medium'
                                        CHECK (priority IN ('low','medium','high','urgent')),
  ADD COLUMN IF NOT EXISTS pic_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags         TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visual_needed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS content      JSONB,          -- rich editor content (TipTap JSON)
  ADD COLUMN IF NOT EXISTS color        TEXT,           -- hex or named color token
  ADD COLUMN IF NOT EXISTS recurring_rule JSONB,        -- { freq, interval, ends_at, count, byday }
  ADD COLUMN IF NOT EXISTS recurring_parent_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT now();

-- Create index for updated_at for optimistic updates
CREATE INDEX IF NOT EXISTS idx_calendar_updated ON calendar_events(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_recurring ON calendar_events(recurring_parent_id) WHERE recurring_parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_pic ON calendar_events(pic_user_id);

-- calendar_event_comments table - for realtime discussions
CREATE TABLE IF NOT EXISTS calendar_event_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_comments_event ON calendar_event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_user ON calendar_event_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_created ON calendar_event_comments(created_at DESC);

-- calendar_event_relations table - for multi-team/scrim/tournament linking
CREATE TABLE IF NOT EXISTS calendar_event_relations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  rel_type   TEXT NOT NULL,   -- 'team', 'scrim', 'tournament', 'division'
  rel_id     UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, rel_type, rel_id)
);

CREATE INDEX IF NOT EXISTS idx_event_relations_event ON calendar_event_relations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_relations_rel ON calendar_event_relations(rel_type, rel_id);

-- RLS Policies for calendar_event_comments
ALTER TABLE calendar_event_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_event_comments_select" ON calendar_event_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_events ce
      WHERE ce.id = calendar_event_comments.event_id
      AND (
        ce.organization_id IN (
          SELECT organization_id FROM team_members
          WHERE user_id = auth.uid() AND is_active = true
        )
        OR auth.uid() = (SELECT owner_id FROM organizations WHERE id = ce.organization_id)
      )
    )
  );

CREATE POLICY "calendar_event_comments_insert" ON calendar_event_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM calendar_events ce
      WHERE ce.id = event_id
      AND (
        ce.organization_id IN (
          SELECT organization_id FROM team_members
          WHERE user_id = auth.uid() AND is_active = true
        )
        OR auth.uid() = (SELECT owner_id FROM organizations WHERE id = ce.organization_id)
      )
    )
  );

CREATE POLICY "calendar_event_comments_update" ON calendar_event_comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_event_comments_delete" ON calendar_event_comments
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM calendar_events ce
      WHERE ce.id = event_id
      AND (auth.uid() = ce.created_by OR auth.uid() = (SELECT owner_id FROM organizations WHERE id = ce.organization_id))
    )
  );

-- RLS Policies for calendar_event_relations
ALTER TABLE calendar_event_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_event_relations_select" ON calendar_event_relations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_events ce
      WHERE ce.id = calendar_event_relations.event_id
      AND (
        ce.organization_id IN (
          SELECT organization_id FROM team_members
          WHERE user_id = auth.uid() AND is_active = true
        )
        OR auth.uid() = (SELECT owner_id FROM organizations WHERE id = ce.organization_id)
      )
    )
  );

CREATE POLICY "calendar_event_relations_insert" ON calendar_event_relations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_events ce
      WHERE ce.id = event_id
      AND (
        ce.organization_id IN (
          SELECT organization_id FROM team_members
          WHERE user_id = auth.uid() AND is_active = true
        )
        OR auth.uid() = (SELECT owner_id FROM organizations WHERE id = ce.organization_id)
      )
    )
  );

CREATE POLICY "calendar_event_relations_delete" ON calendar_event_relations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM calendar_events ce
      WHERE ce.id = event_id
      AND (auth.uid() = ce.created_by OR auth.uid() = (SELECT owner_id FROM organizations WHERE id = ce.organization_id))
    )
  );
