-- =============================================================================
-- 20260516000002_scrim_matchmaking.sql
-- Scrim matchmaking between teams on the platform
-- =============================================================================

CREATE TYPE scrim_request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE scrim_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  to_org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  message         TEXT,
  status          scrim_request_status NOT NULL DEFAULT 'pending',
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  responded_by    UUID REFERENCES auth.users(id),
  responded_at    TIMESTAMPTZ,
  preferred_time  TIMESTAMPTZ,
  format          match_format NOT NULL DEFAULT 'bo3',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_org_id != to_org_id)
);

CREATE INDEX idx_scrim_requests_from ON scrim_requests(from_org_id);
CREATE INDEX idx_scrim_requests_to ON scrim_requests(to_org_id);
CREATE INDEX idx_scrim_requests_status ON scrim_requests(status);
CREATE INDEX idx_scrim_requests_division ON scrim_requests(division_id);

-- RLS
ALTER TABLE scrim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org scrim requests"
  ON scrim_requests FOR SELECT
  USING (
    from_org_id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND is_active = true)
    OR to_org_id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Captain+ can create scrim requests"
  ON scrim_requests FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND from_org_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('captain', 'manager', 'owner')
    )
  );

CREATE POLICY "Captain+ can update scrim requests to their org"
  ON scrim_requests FOR UPDATE
  USING (
    to_org_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('captain', 'manager', 'owner')
    )
    OR from_org_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('captain', 'manager', 'owner')
    )
  );
