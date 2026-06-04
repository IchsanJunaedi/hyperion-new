-- meta_patches: one row per patch version per org
CREATE TABLE IF NOT EXISTS meta_patches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patch_version   TEXT NOT NULL,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, patch_version)
);

-- meta_hero_ratings: one row per hero per patch
CREATE TABLE IF NOT EXISTS meta_hero_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_id          UUID NOT NULL REFERENCES meta_patches(id) ON DELETE CASCADE,
  hero_name         TEXT NOT NULL,
  tier              TEXT NOT NULL CHECK (tier IN ('S', 'A', 'B', 'C', 'D')),
  role_tag          TEXT CHECK (role_tag IS NULL OR role_tag IN ('exp_lane','jungler','mid_lane','gold_lane','roamer')),
  is_ban_priority   BOOLEAN NOT NULL DEFAULT false,
  priority_to_learn BOOLEAN NOT NULL DEFAULT false,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patch_id, hero_name)
);

CREATE INDEX IF NOT EXISTS idx_meta_patches_org ON meta_patches(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_hero_ratings_patch ON meta_hero_ratings(patch_id);

-- RLS
ALTER TABLE meta_patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_hero_ratings ENABLE ROW LEVEL SECURITY;

-- meta_patches: any active org member can read
CREATE POLICY "meta_patches_select" ON meta_patches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = meta_patches.organization_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- meta_patches: coach / manager / owner can insert/update/delete
CREATE POLICY "meta_patches_write" ON meta_patches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = meta_patches.organization_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('coach','manager','owner')
    )
  );

-- meta_hero_ratings: member can read if they can read the patch
CREATE POLICY "meta_hero_ratings_select" ON meta_hero_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meta_patches mp
      JOIN team_members tm ON tm.organization_id = mp.organization_id
      WHERE mp.id = meta_hero_ratings.patch_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- meta_hero_ratings: coach+ can write
CREATE POLICY "meta_hero_ratings_write" ON meta_hero_ratings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meta_patches mp
      JOIN team_members tm ON tm.organization_id = mp.organization_id
      WHERE mp.id = meta_hero_ratings.patch_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('coach','manager','owner')
    )
  );
