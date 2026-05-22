-- RPC: compute opening balance as a single SQL SUM
-- Replaces full historical row scan + JS loop in getFinanceSummary
CREATE OR REPLACE FUNCTION get_opening_balance(p_org_id uuid, p_before_date text)
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END),
    0
  )
  FROM finances
  WHERE organization_id = p_org_id
    AND date < p_before_date::date;
$$;
