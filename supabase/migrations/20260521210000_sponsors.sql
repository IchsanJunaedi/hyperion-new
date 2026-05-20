-- sponsors: one row per sponsor deal per org
CREATE TABLE IF NOT EXISTS sponsors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  logo_url        TEXT,
  status          TEXT NOT NULL DEFAULT 'prospect'
                    CHECK (status IN ('prospect','active','inactive','ended')),
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  deal_value      NUMERIC(15,2),
  currency        TEXT NOT NULL DEFAULT 'IDR',
  start_date      DATE,
  end_date        DATE,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sponsor_deliverables: items to deliver per sponsor
CREATE TABLE IF NOT EXISTS sponsor_deliverables (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id   UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL DEFAULT 'content'
                 CHECK (category IN ('content','post','branding','event','other')),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','in_progress','done','cancelled')),
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sponsor_notes: CRM history timeline per sponsor
CREATE TABLE IF NOT EXISTS sponsor_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_org ON sponsors(organization_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_deliverables_sponsor ON sponsor_deliverables(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_notes_sponsor ON sponsor_notes(sponsor_id);

-- RLS
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_notes ENABLE ROW LEVEL SECURITY;

-- sponsors: manager/owner in the org can do everything
CREATE POLICY "sponsors_manager_access" ON sponsors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = sponsors.organization_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager','owner')
    )
  );

CREATE POLICY "sponsor_deliverables_access" ON sponsor_deliverables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sponsors s
      JOIN team_members tm ON tm.organization_id = s.organization_id
      WHERE s.id = sponsor_deliverables.sponsor_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager','owner')
    )
  );

CREATE POLICY "sponsor_notes_access" ON sponsor_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sponsors s
      JOIN team_members tm ON tm.organization_id = s.organization_id
      WHERE s.id = sponsor_notes.sponsor_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager','owner')
    )
  );
