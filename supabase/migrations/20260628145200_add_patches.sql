-- 1. Add season and is_active columns to meta_patches
ALTER TABLE public.meta_patches ADD COLUMN IF NOT EXISTS season TEXT;
ALTER TABLE public.meta_patches ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- 2. Add patch_id reference column to scrims and tournaments
ALTER TABLE public.scrims ADD COLUMN IF NOT EXISTS patch_id UUID REFERENCES public.meta_patches(id) ON DELETE SET NULL;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS patch_id UUID REFERENCES public.meta_patches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_scrims_patch ON public.scrims(patch_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_patch ON public.tournaments(patch_id);

-- 3. Create helper function is_manager_or_above
CREATE OR REPLACE FUNCTION public.is_manager_or_above(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role IN ('owner','manager')
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_manager_or_above(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_manager_or_above(UUID) TO authenticated;

-- 4. Modify the meta_patches write policy to exclude coach (only manager and owner)
DROP POLICY IF EXISTS "meta_patches_write" ON public.meta_patches;
CREATE POLICY "meta_patches_write" ON public.meta_patches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = meta_patches.organization_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager','owner')
    )
  );

-- 5. Backfill: Set existing patches' season and is_active defaults.
-- For organizations that don't have any patches, create a default active one.
-- Set existing scrims and tournaments to point to the active patch.
DO $$
DECLARE
  v_org RECORD;
  v_patch_id UUID;
  v_count INTEGER;
BEGIN
  FOR v_org IN SELECT id FROM public.organizations LOOP
    -- Check if org already has patches
    SELECT COUNT(*) INTO v_count FROM public.meta_patches WHERE organization_id = v_org.id;

    IF v_count > 0 THEN
      -- Get the latest patch
      SELECT id INTO v_patch_id FROM public.meta_patches WHERE organization_id = v_org.id ORDER BY created_at DESC LIMIT 1;
      
      -- If has patches, update them to have a default season and set the latest one as active
      UPDATE public.meta_patches
      SET season = COALESCE(season, 'Season 13'),
          is_active = (id = v_patch_id)
      WHERE organization_id = v_org.id;
    ELSE
      -- If no patches exist, create a default active one
      INSERT INTO public.meta_patches (organization_id, patch_version, season, is_active)
      VALUES (v_org.id, '2.1.88.1202.1', 'Season 13', true)
      RETURNING id INTO v_patch_id;
    END IF;

    -- Update all existing scrims & tournaments for this organization to point to the active patch
    UPDATE public.scrims SET patch_id = v_patch_id WHERE organization_id = v_org.id;
    UPDATE public.tournaments SET patch_id = v_patch_id WHERE organization_id = v_org.id;
  END LOOP;
END;
$$;

-- 6. Set season to NOT NULL now that it is backfilled
ALTER TABLE public.meta_patches ALTER COLUMN season SET NOT NULL;
