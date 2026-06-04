CREATE OR REPLACE FUNCTION public.get_scrim_win_loss(p_org_id uuid)
RETURNS TABLE(wins bigint, losses bigint, draws bigint, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE sr.is_win = true)  AS wins,
    COUNT(*) FILTER (WHERE sr.is_win = false) AS losses,
    COUNT(*) FILTER (WHERE sr.is_win IS NULL) AS draws,
    COUNT(*)                                  AS total
  FROM scrims s
  INNER JOIN scrim_results sr ON sr.scrim_id = s.id
  WHERE s.organization_id = p_org_id
    AND s.status = 'completed';
$$;
