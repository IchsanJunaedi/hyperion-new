import { createClient } from "@/lib/supabase/server";
import type { AppMetadataWithOrgs } from "@/types/jwt";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let authed: { displayName: string; workspaceHref: string | null } | undefined;
  if (user) {
    const orgs =
      (user.app_metadata as AppMetadataWithOrgs | undefined)?.organizations ?? [];
    const firstOrg = orgs[0];
    authed = {
      displayName:
        (user.user_metadata?.["display_name"] as string | undefined) ??
        user.email ??
        "Akun saya",
      workspaceHref: firstOrg ? `/${firstOrg.slug}` : null,
    };
  }

  return <HeaderClient authed={authed} />;
}
