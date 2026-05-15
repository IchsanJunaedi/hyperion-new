-- Prevent duplicate division names within the same organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_divisions_unique_name_per_org
  ON public.divisions (organization_id, name)
  WHERE is_active = true;
