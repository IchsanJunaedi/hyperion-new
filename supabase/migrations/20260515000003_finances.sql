CREATE TYPE public.finance_type AS ENUM ('income', 'expense');

CREATE TABLE public.finances (
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

CREATE INDEX idx_finances_org ON finances(organization_id);
CREATE INDEX idx_finances_date ON finances(organization_id, date DESC);
