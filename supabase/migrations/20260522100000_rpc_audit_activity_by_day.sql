-- RPC: aggregate audit log activity by day (server-side GROUP BY)
-- Replaces full table scan + JS grouping in fetchAuditActivity
CREATE OR REPLACE FUNCTION get_audit_activity_by_day(p_since timestamptz)
RETURNS TABLE(day_label text, cnt bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    TO_CHAR((created_at AT TIME ZONE 'Asia/Jakarta')::date, 'DD/MM/YYYY') AS day_label,
    COUNT(*)::bigint AS cnt
  FROM audit_logs
  WHERE created_at >= p_since
  GROUP BY (created_at AT TIME ZONE 'Asia/Jakarta')::date
  ORDER BY (created_at AT TIME ZONE 'Asia/Jakarta')::date;
$$;
