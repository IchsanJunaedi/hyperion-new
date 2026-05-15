-- Allow link-only invites (no email/phone_wa required).
-- The existing CHECK (email IS NOT NULL OR phone_wa IS NOT NULL) blocks
-- generic shareable invite links.
ALTER TABLE public.organization_invites
  DROP CONSTRAINT IF EXISTS organization_invites_check;
