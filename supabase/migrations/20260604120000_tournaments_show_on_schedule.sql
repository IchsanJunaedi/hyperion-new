ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS show_on_schedule boolean NOT NULL DEFAULT false;
