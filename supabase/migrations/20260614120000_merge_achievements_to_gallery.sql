-- Add columns to gallery_entries
ALTER TABLE gallery_entries ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE gallery_entries ADD COLUMN division_id uuid REFERENCES divisions(id) ON DELETE SET NULL;
ALTER TABLE gallery_entries ADD COLUMN tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL;
ALTER TABLE gallery_entries ADD COLUMN placement smallint;

-- Migrate achievements data to gallery_entries
DO $$
DECLARE
  rec RECORD;
  div_name TEXT;
  base_slug TEXT;
  final_slug TEXT;
  counter INT;
  temp_desc TEXT;
  pos_text TEXT;
BEGIN
  FOR rec IN SELECT * FROM achievements LOOP
    -- Get division name
    SELECT name INTO div_name FROM divisions WHERE id = rec.division_id;
    IF div_name IS NULL THEN
      div_name := 'Esports';
    END IF;

    -- Map placement to position
    IF rec.placement = 1 THEN
      pos_text := 'Champion';
    ELSIF rec.placement = 2 THEN
      pos_text := 'Runner Up';
    ELSIF rec.placement = 3 THEN
      pos_text := '3rd Place';
    ELSE
      pos_text := 'Winner';
    END IF;

    -- Generate a unique slug
    base_slug := lower(regexp_replace(rec.title, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
    IF base_slug = '' THEN
      base_slug := 'achievement';
    END IF;

    final_slug := base_slug;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM gallery_entries WHERE slug = final_slug) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    temp_desc := COALESCE(rec.description, 'Pencapaian luar biasa tim dalam turnamen.');

    INSERT INTO gallery_entries (
      slug,
      title,
      division,
      tournament_date,
      position,
      status,
      logo_url,
      preview_images,
      description,
      organization_id,
      division_id,
      tournament_id,
      placement
    ) VALUES (
      final_slug,
      rec.title,
      div_name,
      rec.achieved_at::text,
      pos_text,
      'Online',
      rec.image_url,
      CASE WHEN rec.image_url IS NOT NULL THEN ARRAY[rec.image_url] ELSE '{}'::text[] END,
      temp_desc,
      rec.organization_id,
      rec.division_id,
      rec.tournament_id,
      rec.placement
    );
  END LOOP;
END $$;

-- Drop the achievements table
DROP TABLE IF EXISTS achievements CASCADE;
