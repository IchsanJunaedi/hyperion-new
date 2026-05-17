/**
 * GET /api/organization/[orgSlug]/permission-context
 * Get user's permission context for the organization
 *
 * Response: {
 *   role: UserRole,
 *   isOwner: boolean,
 *   isManager: boolean,
 *   isCaptain: boolean,
 *   canCreateCalendars: boolean,
 *   canManageCalendars: boolean,
 *   organizationId: string,
 *   divisions: Division[]
 * }
 */

import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateRequest,
  isOwner,
  getUserRole,
  applyRateLimit,
} from "@/lib/api/permission-middleware";
import {
  success,
  unauthorized,
  notFound,
  internalError,
} from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params;

    // Validate request
    const validation = await validateRequest(request);
    if (!validation.valid) {
      return unauthorized(validation.error);
    }

    const { user, orgId } = validation;

    if (!orgId) {
      return notFound("Organization not found");
    }

    // Apply rate limiting
    const rateLimit = await applyRateLimit(user!.id);
    if (!rateLimit.allowed) {
      return unauthorized("Rate limited");
    }

    const supabase = await createClient();

    // Get organization
    const { data: org } = await supabase
      .from("organizations")
      .select("id, slug")
      .eq("id", orgId)
      .eq("slug", orgSlug)
      .maybeSingle();

    if (!org) {
      return notFound("Organization not found");
    }

    // Get user's role
    const userRole = await getUserRole(user!.id, orgId);

    // Check if user is owner (by email)
    const ownerStatus = isOwner(user!.email);

    // Determine capabilities based on role
    const roleHierarchy: Record<string, number> = {
      owner: 5,
      manager: 4,
      coach: 3,
      captain: 2,
      member: 1,
    };

    const userLevel = roleHierarchy[userRole || ""] || 0;

    // Get divisions (if role is manager+)
    let divisions: unknown[] = [];
    if (userLevel >= 4) {
      // manager+
      const { data: divs } = await supabase
        .from("divisions")
        .select("*")
        .eq("organization_id", orgId)
        .is("deleted_at", null);

      divisions = divs || [];
    }

    return success({
      role: userRole || "guest",
      isOwner: ownerStatus,
      isManager: userLevel >= 4,
      isCaptain: userLevel >= 2,
      canCreateCalendars: userLevel >= 2, // captain+
      canManageCalendars: userLevel >= 4, // manager+
      organizationId: orgId,
      divisions,
      userLevel,
    });
  } catch (err) {
    console.error("Permission context GET error:", err);
    return internalError();
  }
}
