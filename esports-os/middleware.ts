import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import type { AppMetadataWithOrgs } from "@/types/jwt";

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN ?? "hyperionteam.id";

/**
 * Routes that should never be intercepted as a `[team-slug]`.
 * Anything matching one of these segments is treated as a global app route.
 */
const RESERVED_ROOT_SEGMENTS = new Set([
  "login",
  "register",
  "callback",
  "invite",
  "auth",
  "_next",
  "api",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
]);

function isMainDomain(hostname: string): boolean {
  if (
    hostname === MAIN_DOMAIN ||
    hostname === `www.${MAIN_DOMAIN}` ||
    hostname === "localhost" ||
    hostname.startsWith("localhost:") ||
    hostname.startsWith("127.0.0.1")
  ) {
    return true;
  }
  return hostname.endsWith(".vercel.app");
}

/**
 * Resolve a custom hostname (e.g. `onicteam.id`) → org slug by looking it up
 * in `organizations.custom_domain`. Returns `null` if no match.
 */
async function resolveCustomDomain(hostname: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("organizations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select("slug" as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("custom_domain" as any, hostname)
      .maybeSingle();

    const slug = (data as { slug?: string } | null)?.slug ?? null;
    return slug;
  } catch {
    // Admin client may not be configured yet during local bootstrap;
    // fall back to "no custom domain" rather than crashing the request.
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? request.nextUrl.hostname;

  // 1. Skip static assets, internal Next.js routes, API routes, and files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next({ request });
  }

  const { supabase, response } = createMiddlewareClient(request);

  // Always refresh the auth session so cookies stay valid.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Resolve hostname → orgSlug (custom domain support)
  let hostOrgSlug: string | null = null;
  if (!isMainDomain(hostname)) {
    hostOrgSlug = await resolveCustomDomain(hostname);
    if (!hostOrgSlug) {
      return NextResponse.redirect(new URL("/", `https://${MAIN_DOMAIN}`));
    }
  }

  // 3. Parse path: /{team-slug}/{section?}
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const section = segments[1];

  // Reserved global routes — let Next.js handle normally.
  if (firstSegment && RESERVED_ROOT_SEGMENTS.has(firstSegment)) {
    return response;
  }

  // Logged-in user hitting `/` → redirect to their first org workspace.
  if (!firstSegment && user) {
    const orgs =
      (user.app_metadata as AppMetadataWithOrgs | undefined)?.organizations ??
      [];
    const firstOrg = orgs[0];
    if (firstOrg?.slug) {
      return NextResponse.redirect(new URL(`/${firstOrg.slug}`, request.url));
    }
    return response;
  }

  // No team-slug in the URL (root, marketing landing, etc.) → no auth gate.
  if (!firstSegment) {
    return response;
  }

  const resolvedSlug = hostOrgSlug ?? firstSegment;

  // 4. Authorization
  const orgs =
    (user?.app_metadata as AppMetadataWithOrgs | undefined)?.organizations ??
    [];
  const isMember = orgs.some((org) => org.slug === resolvedSlug);

  // Visitor (no auth) trying to access a protected workspace section.
  if (!user && section) {
    return NextResponse.redirect(new URL(`/${resolvedSlug}`, request.url));
  }

  // Logged in but not a member of this org → public profile only.
  if (user && !isMember && section) {
    return NextResponse.redirect(new URL(`/${resolvedSlug}`, request.url));
  }

  // 5. Inject org context for downstream Server Components.
  response.headers.set("x-org-slug", resolvedSlug);
  if (user) {
    response.headers.set("x-user-id", user.id);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image, _next/data
     * - favicon.ico, robots.txt, sitemap.xml, manifest.json
     * - any file with an extension (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|manifest.json).*)",
  ],
};
