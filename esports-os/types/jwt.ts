/**
 * Custom JWT claims injected by `custom_access_token_hook` (Supabase Auth Hook).
 *
 * The hook adds an `organizations` array to `app_metadata` so the middleware
 * can authorize requests without an extra DB round-trip.
 */
export interface OrgJwtClaim {
  org_id: string;
  slug: string;
  role: "owner" | "captain" | "member" | "coach" | "manager";
  divisions: string[];
}

export interface AppMetadataWithOrgs {
  organizations?: OrgJwtClaim[];
  [key: string]: unknown;
}
