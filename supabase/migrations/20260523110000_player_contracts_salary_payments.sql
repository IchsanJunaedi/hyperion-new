-- Player contracts: one row per contract per player (supports history of raises)
CREATE TABLE player_contracts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_salary  BIGINT NOT NULL DEFAULT 0,
  start_date      DATE NOT NULL,
  end_date        DATE,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'expired', 'terminated')),
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE player_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manager/owner can read contracts"
  ON player_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = player_contracts.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'manager')
        AND tm.is_active = true
    )
  );

CREATE POLICY "Manager/owner can write contracts"
  ON player_contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = player_contracts.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'manager')
        AND tm.is_active = true
    )
  );

-- Salary payments: log of monthly disbursements per contract
CREATE TABLE salary_payments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id     UUID NOT NULL REFERENCES player_contracts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pay_period      DATE NOT NULL,   -- first day of the month, e.g. 2026-05-01
  amount          BIGINT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid')),
  paid_at         TIMESTAMPTZ,
  paid_by         UUID REFERENCES auth.users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (contract_id, pay_period)
);

ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manager/owner can read payments"
  ON salary_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = salary_payments.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'manager')
        AND tm.is_active = true
    )
  );

CREATE POLICY "Manager/owner can write payments"
  ON salary_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = salary_payments.organization_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'manager')
        AND tm.is_active = true
    )
  );
