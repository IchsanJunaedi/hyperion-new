ALTER TABLE divisions ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN divisions.is_public IS 'When true, this division is shown on the public landing page';
