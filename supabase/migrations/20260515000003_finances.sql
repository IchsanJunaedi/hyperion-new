DO $$ BEGIN
  CREATE TYPE public.finance_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.finances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type            finance_type NOT NULL,
  amount          INTEGER NOT NULL CHECK (amount > 0),
  category        TEXT NOT NULL,
  description     TEXT,
  date            DATE NOT NULL,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finances_org ON finances(organization_id);
CREATE INDEX IF NOT EXISTS idx_finances_date ON finances(organization_id, date DESC);
