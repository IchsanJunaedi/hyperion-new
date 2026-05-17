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
  "forgot-password",
  "reset-password",
  "callback",
  "invite",
  "auth",
  "onboarding",
  "dashboard",
  "manage",
  "_next",
  "api",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
]);

/** Reserved segments that require an authenticated session. */
const AUTH_REQUIRED_SEGMENTS = new Set(["onboarding", "manage"]);

/** Reserved segments that should redirect away if user IS authenticated. */
const AUTH_ONLY_VISITOR_SEGMENTS = new Set(["login", "register"]);

/**
 * Build a redirect response that carries forward any cookies the
 * Supabase middleware client wrote onto `from` (notably the rotated
 * access/refresh tokens after a session refresh). Without this,
 * `NextResponse.redirect()` would return a fresh response object and
 * the rotated tokens would never reach the browser, silently logging
 * the user out on the next request.
 */
function redirectWithCookies(url: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

/**
 * Same idea as `redirectWithCookies` but for an internal URL rewrite —
 * used on custom-domain requests so the downstream Next.js app router
 * always sees the canonical `/{slug}/{section?}` path even though the
 * browser URL is `/{section}` on `onicteam.id`.
 */
function rewriteWithCookies(
  url: URL,
  from: NextResponse,
  request: NextRequest,
): NextResponse {
  const rewrite = NextResponse.rewrite(url, { request });
  for (const cookie of from.cookies.getAll()) {
    rewrite.cookies.set(cookie);
  }
  return rewrite;
}

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
      .select("slug")
      .eq("custom_domain", hostname)
      .maybeSingle();
    return data?.slug ?? null;
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
      // Even though we're sending the user to a different host, the rotated
      // auth cookies are scoped to the *request* host (e.g. onicteam.id) and
      // must travel back so the next visit there isn't silently logged out.
      return redirectWithCookies(
        new URL("/", `https://${MAIN_DOMAIN}`),
        response,
      );
    }
  }

  // 2b. On custom domains the URL `/foo/bar` actually means
  // `/{hostOrgSlug}/foo/bar` once you account for the host. Build the
  // canonical "internal" path now so all auth gating + the eventual
  // rewrite use the same shape as a main-domain request.
  const internalPathname = hostOrgSlug
    ? pathname === "/"
      ? `/${hostOrgSlug}`
      : `/${hostOrgSlug}${pathname}`
    : pathname;

  // 3. Parse path: /{team-slug}/{section?}
  const segments = internalPathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const section = segments[1];

  // Reserved global routes — let Next.js handle normally. Reserved
  // segments shouldn't appear under a custom-domain rewrite anyway, but
  // we double-check by gating on `!hostOrgSlug`.
  if (
    !hostOrgSlug &&
    firstSegment &&
    RESERVED_ROOT_SEGMENTS.has(firstSegment)
  ) {
    // Special guard for /dashboard
    if (firstSegment === "dashboard") {
      const ownerEmail = process.env.OWNER_EMAIL;
      if (!user) {
        if (section !== "login") {
          return redirectWithCookies(
            new URL("/dashboard/login", request.url),
            response,
          );
        }
      } else {
        if (section === "login") {
          return redirectWithCookies(
            new URL("/dashboard", request.url),
            response,
          );
        }
        if (!ownerEmail || user.email !== ownerEmail) {
          return redirectWithCookies(new URL("/", request.url), response);
        }
      }
      return response;
    }

    // Onboarding requires auth. Bounce visitors to /login with a
    // post-login redirect back to the originally requested path.
    if (!user && AUTH_REQUIRED_SEGMENTS.has(firstSegment)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return redirectWithCookies(loginUrl, response);
    }
    // Authenticated users shouldn't see /login or /register; send them
    // to their role-appropriate destination via DB query in the page/action.
    if (user && AUTH_ONLY_VISITOR_SEGMENTS.has(firstSegment)) {
      const nextParam = request.nextUrl.searchParams.get("next");
      const safeNext =
        nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
          ? nextParam
          : null;
      // If there's an explicit next param, honor it; otherwise redirect to /
      // which will do the DB-based role redirect in the page component.
      const dest = safeNext ?? "/";
      return redirectWithCookies(new URL(dest, request.url), response);
    }
    return response;
  }

  // Logged-in user hitting the main-domain `/` → let the page component
  // handle role-based redirect via DB query.
  if (!hostOrgSlug && !firstSegment && user) {
    return response;
  }

  // No team-slug in the URL (root, marketing landing, etc.) → no auth gate.
  if (!firstSegment) {
    return response;
  }

  const resolvedSlug = hostOrgSlug ?? firstSegment;

  // Public-team-page URL on the *current* host. On a custom domain that
  // is just `/` (the slug is implicit in the hostname); on the main
  // domain it is `/{slug}`. Used as the redirect target whenever a
  // visitor / non-member tries to reach a workspace section.
  const publicHomePath = hostOrgSlug ? "/" : `/${resolvedSlug}`;

  // 4. Authorization — let page-level components handle member checks via DB.
  // Middleware only blocks unauthenticated users from workspace sub-routes.
  
  // Visitor (no auth) trying to access a protected workspace section.
  if (!user && section) {
    return redirectWithCookies(
      new URL(publicHomePath, request.url),
      response,
    );
  }

  // 5. Inject org context for downstream Server Components.
  response.headers.set("x-org-slug", resolvedSlug);
  if (user) {
    response.headers.set("x-user-id", user.id);
  }

  // 6. On a custom domain, rewrite the URL internally so the Next.js
  // app router matches `/{slug}/{section}` even though the browser is
  // on `/{section}`. The browser URL stays unchanged.
  if (hostOrgSlug && internalPathname !== pathname) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = internalPathname;
    const rewritten = rewriteWithCookies(rewriteUrl, response, request);
    rewritten.headers.set("x-org-slug", resolvedSlug);
    if (user) {
      rewritten.headers.set("x-user-id", user.id);
    }
    return rewritten;
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
