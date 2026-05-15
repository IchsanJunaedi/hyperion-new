DO $$ BEGIN
  CREATE TYPE public.content_platform AS ENUM ('ig', 'tiktok', 'x');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft', 'scheduled', 'approved', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.content_calendar (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform        content_platform NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  status          content_status NOT NULL DEFAULT 'draft',
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_calendar_org ON content_calendar(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(organization_id, status);
