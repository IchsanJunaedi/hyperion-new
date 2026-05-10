-- =============================================================================
-- 20260510000005_storage_buckets.sql
--
-- Storage buckets + RLS policies on storage.objects.
--
-- Path conventions (used by the policies below):
--   org-logos/{org_id}/...      ← logos, banners, achievement images (PUBLIC)
--   org-private/{org_id}/...    ← strategy-note / scrim attachments (PRIVATE)
--   avatars/{user_id}/...       ← user avatars (PUBLIC)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'org-logos', 'org-logos', true,
    5242880, -- 5 MB
    ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
  ),
  (
    'org-private', 'org-private', false,
    52428800, -- 50 MB
    NULL  -- any mime type
  ),
  (
    'avatars', 'avatars', true,
    2097152, -- 2 MB
    ARRAY['image/png','image/jpeg','image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- org-logos: anyone can read; only captain+ of the matching org can write.
-- ---------------------------------------------------------------------------

CREATE POLICY "org_logos_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-logos');

CREATE POLICY "org_logos_insert_captain"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-logos'
    AND public.is_captain_or_above(
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "org_logos_update_captain"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'org-logos'
    AND public.is_captain_or_above(
      ((storage.foldername(name))[1])::uuid
    )
  )
  WITH CHECK (
    bucket_id = 'org-logos'
    AND public.is_captain_or_above(
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "org_logos_delete_captain"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'org-logos'
    AND public.is_captain_or_above(
      ((storage.foldername(name))[1])::uuid
    )
  );

-- ---------------------------------------------------------------------------
-- org-private: only members of the org can read/write inside that org's folder.
-- ---------------------------------------------------------------------------

CREATE POLICY "org_private_read_member"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'org-private'
    AND public.is_member_of(
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "org_private_insert_member"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-private'
    AND public.is_member_of(
      ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "org_private_update_uploader_or_captain"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'org-private'
    AND (
      owner = auth.uid()
      OR public.is_captain_or_above(
        ((storage.foldername(name))[1])::uuid
      )
    )
  )
  WITH CHECK (
    bucket_id = 'org-private'
    AND (
      owner = auth.uid()
      OR public.is_captain_or_above(
        ((storage.foldername(name))[1])::uuid
      )
    )
  );

CREATE POLICY "org_private_delete_uploader_or_captain"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'org-private'
    AND (
      owner = auth.uid()
      OR public.is_captain_or_above(
        ((storage.foldername(name))[1])::uuid
      )
    )
  );

-- ---------------------------------------------------------------------------
-- avatars: anyone can read; users can only write their own folder.
-- ---------------------------------------------------------------------------

CREATE POLICY "avatars_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_self"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1])::uuid = auth.uid()
  );

CREATE POLICY "avatars_update_self"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1])::uuid = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1])::uuid = auth.uid()
  );

CREATE POLICY "avatars_delete_self"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1])::uuid = auth.uid()
  );
