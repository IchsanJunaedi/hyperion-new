ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_sort_order int NOT NULL DEFAULT 0;
