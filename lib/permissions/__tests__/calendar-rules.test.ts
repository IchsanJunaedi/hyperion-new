import { describe, it, expect } from "vitest";
import {
  resolvePermissions,
  hasPermission,
  isRoleHigherOrEqual,
  getVisibilityDescription,
  getAllowedActionsForRole,
  canPerformAction,
  canViewCalendar,
  canCreateEvents,
  canEditEvents,
  canDeleteEvents,
  canManageCalendar,
  canManagePermissions,
  getViewableByRoles,
  getCreationAllowedByRoles,
  analyzeActionRequirements,
} from "../calendar-rules";
import type { CalendarMemberPermission, CalendarPermission } from "../calendar-types";

describe("resolvePermissions — owner", () => {
  it("has all permissions on public-workspace", () => {
    const perms = resolvePermissions("owner", "public-workspace");
    expect(canViewCalendar(perms)).toBe(true);
    expect(canCreateEvents(perms)).toBe(true);
    expect(canManageCalendar(perms)).toBe(true);
    expect(canManagePermissions(perms)).toBe(true);
  });

  it("has all permissions on private (owner overrides everything)", () => {
    const perms = resolvePermissions("owner", "private");
    expect(canViewCalendar(perms)).toBe(true);
    expect(canManageCalendar(perms)).toBe(true);
  });

  it("has all permissions on management-only", () => {
    const perms = resolvePermissions("owner", "management-only");
    expect(canViewCalendar(perms)).toBe(true);
    expect(canManageCalendar(perms)).toBe(true);
  });
});

describe("resolvePermissions — manager", () => {
  it("can view and create on public-workspace", () => {
    const perms = resolvePermissions("manager", "public-workspace");
    expect(canViewCalendar(perms)).toBe(true);
    expect(canCreateEvents(perms)).toBe(true);
  });

  it("cannot view private calendar (not creator)", () => {
    const perms = resolvePermissions("manager", "private", undefined, false);
    expect(canViewCalendar(perms)).toBe(false);
  });

  it("can view management-only calendar", () => {
    const perms = resolvePermissions("manager", "management-only");
    expect(canViewCalendar(perms)).toBe(true);
  });

  it("can manage management-only calendar", () => {
    const perms = resolvePermissions("manager", "management-only");
    expect(canManageCalendar(perms)).toBe(true);
  });
});

describe("resolvePermissions — coach", () => {
  it("can view management-only calendar", () => {
    const perms = resolvePermissions("coach", "management-only");
    expect(canViewCalendar(perms)).toBe(true);
  });

  it("cannot manage management-only calendar", () => {
    const perms = resolvePermissions("coach", "management-only");
    expect(canManageCalendar(perms)).toBe(false);
  });

  it("cannot view private calendar (not creator)", () => {
    const perms = resolvePermissions("coach", "private", undefined, false);
    expect(canViewCalendar(perms)).toBe(false);
  });

  it("can view team-only calendar", () => {
    const perms = resolvePermissions("coach", "team-only");
    expect(canViewCalendar(perms)).toBe(true);
  });
});

describe("resolvePermissions — member", () => {
  it("can view public-workspace calendar", () => {
    const perms = resolvePermissions("member", "public-workspace");
    expect(canViewCalendar(perms)).toBe(true);
  });

  it("cannot view management-only calendar", () => {
    const perms = resolvePermissions("member", "management-only");
    expect(canViewCalendar(perms)).toBe(false);
  });

  it("cannot manage any calendar", () => {
    const perms = resolvePermissions("member", "public-workspace");
    expect(canManageCalendar(perms)).toBe(false);
  });
});

describe("resolvePermissions — creator override", () => {
  it("captain as creator of private calendar gets full access", () => {
    const perms = resolvePermissions("captain", "private", undefined, true);
    expect(canViewCalendar(perms)).toBe(true);
    expect(canManageCalendar(perms)).toBe(true);
  });

  it("captain as non-creator of management-only cannot manage the calendar", () => {
    const perms = resolvePermissions("captain", "management-only", undefined, false);
    expect(canManageCalendar(perms)).toBe(false);
  });
});

describe("resolvePermissions — null role", () => {
  it("returns empty permission set for null role", () => {
    const perms = resolvePermissions(null, "public-workspace");
    expect(perms.size).toBe(0);
  });
});

describe("resolvePermissions — selected-members with explicit permissions", () => {
  const dummyPerms = (overrides: Partial<CalendarMemberPermission>): CalendarMemberPermission => ({
    id: "p1",
    organization_id: "org-1",
    calendar_id: "c1",
    member_user_id: "u1",
    can_view: false,
    can_create_event: false,
    can_edit_event: false,
    can_delete_event: false,
    can_manage_permissions: false,
    created_at: "",
    updated_at: "",
    deleted_at: null,
    created_by: "u2",
    updated_by: null,
    ...overrides,
  });

  it("resolves view permission when explicitly granted", () => {
    const perms = resolvePermissions("member", "selected-members", dummyPerms({ can_view: true }));
    expect(canViewCalendar(perms)).toBe(true);
  });

  it("resolves create-event permission when explicitly granted", () => {
    const perms = resolvePermissions("member", "selected-members", dummyPerms({ can_create_event: true }));
    expect(canCreateEvents(perms)).toBe(true);
  });

  it("resolves edit-event permission when explicitly granted", () => {
    const perms = resolvePermissions("member", "selected-members", dummyPerms({ can_edit_event: true }));
    expect(canEditEvents(perms)).toBe(true);
  });

  it("resolves delete-event permission when explicitly granted", () => {
    const perms = resolvePermissions("member", "selected-members", dummyPerms({ can_delete_event: true }));
    expect(canDeleteEvents(perms)).toBe(true);
  });

  it("resolves manage-permissions when explicitly granted", () => {
    const perms = resolvePermissions("member", "selected-members", dummyPerms({ can_manage_permissions: true }));
    expect(canManagePermissions(perms)).toBe(true);
  });
});

describe("isRoleHigherOrEqual", () => {
  it("owner >= owner", () => expect(isRoleHigherOrEqual("owner", "owner")).toBe(true));
  it("owner >= manager", () => expect(isRoleHigherOrEqual("owner", "manager")).toBe(true));
  it("owner >= member", () => expect(isRoleHigherOrEqual("owner", "member")).toBe(true));
  it("manager >= coach", () => expect(isRoleHigherOrEqual("manager", "coach")).toBe(true));
  it("coach is NOT >= manager", () => expect(isRoleHigherOrEqual("coach", "manager")).toBe(false));
  it("member is NOT >= captain", () => expect(isRoleHigherOrEqual("member", "captain")).toBe(false));
  it("captain >= captain", () => expect(isRoleHigherOrEqual("captain", "captain")).toBe(true));
  it("returns false for null role", () => expect(isRoleHigherOrEqual(null, "member")).toBe(false));
});

describe("getVisibilityDescription", () => {
  it("returns the correct description for private", () => {
    expect(getVisibilityDescription("private")).toBe("Only you can see this calendar");
  });

  it("returns the correct description for management-only", () => {
    expect(getVisibilityDescription("management-only")).toBe("Owner, managers, and coaches can see this calendar");
  });

  it("returns the correct description for captain-only", () => {
    expect(getVisibilityDescription("captain-only")).toBe("Captains, managers, coaches, and owner can see this calendar");
  });

  it("returns the correct description for team-only", () => {
    expect(getVisibilityDescription("team-only")).toBe("All team members can see this calendar");
  });

  it("returns the correct description for selected-members", () => {
    expect(getVisibilityDescription("selected-members")).toBe("Only selected members can see this calendar");
  });

  it("returns the correct description for public-workspace", () => {
    expect(getVisibilityDescription("public-workspace")).toBe("Everyone in the workspace can see this calendar");
  });
});

describe("getAllowedActionsForRole", () => {
  it("returns empty array for null role", () => {
    expect(getAllowedActionsForRole(null, "public-workspace")).toEqual([]);
  });

  it("returns correct permissions list for member on public-workspace", () => {
    const actions = getAllowedActionsForRole("member", "public-workspace");
    expect(actions).toContain("view");
    expect(actions).not.toContain("create-event");
  });
});

describe("Permission Helpers", () => {
  it("validates hasPermission and canPerformAction", () => {
    const perms = new Set<CalendarPermission>(["view", "create-event"]);
    expect(hasPermission(perms, "view")).toBe(true);
    expect(hasPermission(perms, "edit-event")).toBe(false);
    expect(canPerformAction(perms, "create-event")).toBe(true);
  });
});

describe("getViewableByRoles", () => {
  it("identifies viewable roles for private (owner and captain in matrix)", () => {
    expect(getViewableByRoles("private")).toEqual(["owner", "captain"]);
  });

  it("identifies viewable roles for management-only", () => {
    const roles = getViewableByRoles("management-only");
    expect(roles).toContain("owner");
    expect(roles).toContain("manager");
    expect(roles).toContain("coach");
    expect(roles).not.toContain("member");
  });
});

describe("getCreationAllowedByRoles", () => {
  it("identifies creation allowed roles for team-only", () => {
    const roles = getCreationAllowedByRoles("team-only");
    expect(roles).toContain("owner");
    expect(roles).toContain("manager");
    expect(roles).toContain("coach");
    expect(roles).toContain("captain");
    expect(roles).not.toContain("member");
  });
});

describe("analyzeActionRequirements", () => {
  it("analyzes manage-calendar requirements correctly", () => {
    const analysis = analyzeActionRequirements("manage-calendar");
    expect(analysis.minimumRole).toBe("owner");
    expect(analysis.visibilityRecommendations).toContain("public-workspace");
    expect(analysis.visibilityRecommendations).toContain("private");
    expect(analysis.restrictedVisibilities).toEqual([]);
  });
});
