-- =============================================================================
-- 20260510000004_jwt_hook.sql
--
-- Custom Access Token hook. Supabase Auth invokes this function as the
-- supabase_auth_admin role on every JWT issuance / refresh. We use it to
-- inject `app_metadata.organizations` — an array of every org the user is
-- a member of, with role + division slugs.
--
-- Shape (matches types/jwt.ts > OrgJwtClaim):
--
--   {
--     "organizations": [
--       { "org_id": "...", "slug": "hyperion-six", "role": "owner",
--         "divisions": [ "mlbb", "valorant" ] },
--       ...
--     ]
--   }
--
-- We deliberately keep `divisions` as an array of slug strings (not
-- {id, slug} objects). The middleware only needs the slug to gate
-- routes, and a smaller JWT keeps the auth cookie under the 4 KB
-- header budget.
--
-- After this migration runs, the hook still has to be flipped on in
-- Supabase Auth → Hooks → Custom Access Token, OR by leaving the entry
-- in `config.toml` and running `supabase db push --include-all`.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  uid uuid;
  orgs jsonb;
BEGIN
  uid := (event ->> 'user_id')::uuid;
  claims := event -> 'claims';

  -- Aggregate one entry per (user, organization) the user is active in.
  -- Highest-priority role across the user's division rows wins.
  SELECT COALESCE(jsonb_agg(row_data ORDER BY row_data ->> 'slug'), '[]'::jsonb)
  INTO orgs
  FROM (
    SELECT jsonb_build_object(
      'org_id', tm.organization_id,
      'slug', o.slug,
      'role', (
        SELECT tm2.role::text
        FROM public.team_members tm2
        WHERE tm2.user_id = uid
          AND tm2.organization_id = tm.organization_id
          AND tm2.is_active = true
        ORDER BY array_position(
          ARRAY['owner','captain','manager','coach','member']::text[],
          tm2.role::text
        )
        LIMIT 1
      ),
      'divisions', (
        SELECT COALESCE(jsonb_agg(slug ORDER BY slug), '[]'::jsonb)
        FROM (
          SELECT DISTINCT d.slug
          FROM public.team_members tm3
          JOIN public.divisions d ON d.id = tm3.division_id
          WHERE tm3.user_id = uid
            AND tm3.organization_id = tm.organization_id
            AND tm3.is_active = true
        ) divs
      )
    ) AS row_data
    FROM public.team_members tm
    JOIN public.organizations o ON o.id = tm.organization_id
    WHERE tm.user_id = uid AND tm.is_active = true
    GROUP BY tm.organization_id, o.slug
  ) sub;

  claims := jsonb_set(
    claims,
    '{app_metadata}',
    COALESCE(claims -> 'app_metadata', '{}'::jsonb)
      || jsonb_build_object('organizations', orgs)
  );

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Lock the hook down: only Supabase Auth admin should be able to run it.
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb)
  TO supabase_auth_admin;

-- The hook needs to read team_members / organizations / divisions when
-- invoked as supabase_auth_admin. SECURITY DEFINER takes care of the
-- table reads, but we still need the admin role to be able to call the
-- function and see the schema.
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
