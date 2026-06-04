-- Add bonus_percentage to player_contracts
ALTER TABLE player_contracts
  ADD COLUMN IF NOT EXISTS bonus_percentage numeric(5,2) NOT NULL DEFAULT 0
    CHECK (bonus_percentage >= 0 AND bonus_percentage <= 100);

-- Per-tournament bonus distribution per contract
CREATE TABLE IF NOT EXISTS tournament_bonus_distributions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id     uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  contract_id       uuid NOT NULL REFERENCES player_contracts(id) ON DELETE CASCADE,
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL,
  tournament_name   text NOT NULL,
  placement         integer,
  bonus_amount      bigint NOT NULL,
  bonus_percentage  numeric(5,2) NOT NULL,
  distributed_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, contract_id)
);

ALTER TABLE tournament_bonus_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view bonus distributions"
  ON tournament_bonus_distributions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
