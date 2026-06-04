-- Make achievements.organization_id nullable.
-- Admin CMS creates site-wide achievements (no org picker in the form), so the
-- previous NOT NULL constraint caused every admin-created achievement to fail
-- (server action inserted "" into a uuid column). NULL now means "site-wide".
ALTER TABLE achievements ALTER COLUMN organization_id DROP NOT NULL;
