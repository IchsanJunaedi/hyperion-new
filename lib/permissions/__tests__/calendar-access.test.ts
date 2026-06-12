/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getUserRoleInOrg,
  checkCalendarVisibility,
  checkEventVisibility,
  checkCalendarPermission,
  getAccessibleCalendars,
  getAccessibleEvents,
  userCanManageCalendars,
  getPermissionContext,
} from "../calendar-access";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

describe("Calendar Access Permissions", () => {
  let mockClient: any;
  let mockQuery: any;
  let mockAdminClient: any;
  let currentTable = "";
  let lastIdQueried = "";
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    currentTable = "";
    lastIdQueried = "";

    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((field, value) => {
        if (field === "id") {
          lastIdQueried = value;
        }
        return mockQuery;
      }),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    };
    // Production code uses .maybeSingle(); tests configure .single() for
    // historical reasons. Alias them so one mock setup drives both.
    mockQuery.maybeSingle = mockQuery.single;

    mockClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { email: "user@test.com" } }, error: null }),
      },
      from: vi.fn().mockImplementation((table) => {
        currentTable = table;
        return mockQuery;
      }),
    };

    mockAdminClient = {
      from: vi.fn().mockImplementation((table) => {
        currentTable = table;
        return mockQuery;
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockClient as any);
    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getUserRoleInOrg", () => {
    it("returns owner role when email matches OWNER_EMAIL env var", async () => {
      process.env.OWNER_EMAIL = "user@test.com";
      const role = await getUserRoleInOrg("user-123", "org-123");
      expect(role).toBe("owner");
    });

    it("returns team member role from database when not owner", async () => {
      process.env.OWNER_EMAIL = "owner@test.com";
      mockQuery.single.mockResolvedValue({ data: { role: "coach" }, error: null });

      const role = await getUserRoleInOrg("user-123", "org-123");
      expect(role).toBe("coach");
      expect(mockClient.from).toHaveBeenCalledWith("team_members");
    });

    it("returns null when user is not in org (PGRST116)", async () => {
      process.env.OWNER_EMAIL = "owner@test.com";
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });

      const role = await getUserRoleInOrg("user-123", "org-123");
      expect(role).toBeNull();
    });
  });

  describe("checkCalendarVisibility", () => {
    it("returns not found result when calendar does not exist", async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

      const result = await checkCalendarVisibility("u1", "cal-1", "org-1");
      expect(result).toEqual({
        allowed: false,
        reason: "Calendar not found",
        role: null,
      });
    });

    it("denies access when calendar is deleted", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        return Promise.resolve({
          data: { id: "cal-1", visibility: "team-only", deleted_at: "2026-05-01" },
          error: null,
        });
      });

      const result = await checkCalendarVisibility("u1", "cal-1", "org-1");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Calendar has been deleted");
    });

    it("allows access to private calendar only for creator", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        return Promise.resolve({
          data: { id: "cal-1", visibility: "private", created_by: "creator-id" },
          error: null,
        });
      });

      const resultAsCreator = await checkCalendarVisibility("creator-id", "cal-1", "org-1");
      expect(resultAsCreator.allowed).toBe(true);

      const resultAsOther = await checkCalendarVisibility("other-id", "cal-1", "org-1");
      expect(resultAsOther.allowed).toBe(false);
      expect(resultAsOther.reason).toBe("Private calendar - creator only");
    });

    it("allows access to management-only calendar for owner, manager, and coach", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "coach" }, error: null });
        return Promise.resolve({
          data: { id: "cal-1", visibility: "management-only" },
          error: null,
        });
      });

      const result = await checkCalendarVisibility("coach-id", "cal-1", "org-1");
      expect(result.allowed).toBe(true);
      expect(result.role).toBe("coach");
    });

    it("denies access to management-only calendar for captain or member", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "captain" }, error: null });
        return Promise.resolve({
          data: { id: "cal-1", visibility: "management-only" },
          error: null,
        });
      });

      const result = await checkCalendarVisibility("cap-id", "cal-1", "org-1");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Management-only calendar - requires manager or coach role");
    });

    it("allows access to selected-members calendar for explicit permissions", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "selected-members", created_by: "creator-id" },
            error: null,
          });
        }
        if (currentTable === "calendar_member_permissions") return Promise.resolve({ data: { can_view: true }, error: null });
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarVisibility("user-id", "cal-1", "org-1");
      expect(result.allowed).toBe(true);
    });

    it("denies access to selected-members calendar if no explicit permissions exist", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "selected-members", created_by: "creator-id" },
            error: null,
          });
        }
        if (currentTable === "calendar_member_permissions") return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarVisibility("user-id", "cal-1", "org-1");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Selected-members calendar - no explicit access granted");
    });
  });

  describe("checkEventVisibility", () => {
    it("falls back to calendar visibility when no event visibility override exists", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "event_visibility") return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        if (currentTable === "calendar_events") return Promise.resolve({ data: { calendar_id: "cal-1" }, error: null });
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "member" }, error: null });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "public-workspace" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkEventVisibility("u1", "event-1", "org-1");
      expect(result.allowed).toBe(true);
      expect(result.role).toBe("member");
    });

    it("uses event-level visibility settings when override is present", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "event_visibility") {
          return Promise.resolve({
            data: { id: "ovr-1", visibility: "private", allowed_member_ids: [], calendar_id: "cal-1" },
            error: null,
          });
        }
        if (currentTable === "calendar_events") return Promise.resolve({ data: { created_by: "creator-id" }, error: null });
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "member" }, error: null });
        return Promise.resolve({ data: null, error: null });
      });

      const creatorResult = await checkEventVisibility("creator-id", "event-1", "org-1");
      expect(creatorResult.allowed).toBe(true);

      const otherResult = await checkEventVisibility("other-id", "event-1", "org-1");
      expect(otherResult.allowed).toBe(false);
      expect(otherResult.reason).toBe("Private event - creator only");
    });
  });

  describe("checkCalendarPermission", () => {
    it("returns view check result when permission type is view", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: null, error: { code: "PGRST116" } });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "public-workspace" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarPermission("u1", "cal-1", "view", "org-1");
      expect(result.allowed).toBe(true);
    });

    it("checks manage-calendar permissions correctly for owner vs manager", async () => {
      // Owner Case
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "owner" }, error: null });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "public-workspace", created_by: "creator-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const ownerResult = await checkCalendarPermission("owner-id", "cal-1", "manage-calendar", "org-1");
      expect(ownerResult.allowed).toBe(true);

      // Manager Case
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "manager" }, error: null });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "public-workspace", created_by: "creator-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const managerResult = await checkCalendarPermission("manager-id", "cal-1", "manage-calendar", "org-1");
      expect(managerResult.allowed).toBe(false);
      expect(managerResult.reason).toBe("manage-calendar - requires owner or creator status");
    });

    it("allows owner to create-event on any calendar", async () => {
      process.env.OWNER_EMAIL = "user@test.com";
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "team-only", created_by: "other-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarPermission("user-123", "cal-1", "create-event", "org-1");
      expect(result.allowed).toBe(true);
    });

    it("allows manager to create-event on non-private calendar", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "manager" }, error: null });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "team-only", created_by: "other-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarPermission("manager-id", "cal-1", "create-event", "org-1");
      expect(result.allowed).toBe(true);
    });

    it("denies member from create-event", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "member" }, error: null });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "team-only", created_by: "other-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarPermission("member-id", "cal-1", "create-event", "org-1");
      expect(result.allowed).toBe(false);
    });

    it("allows owner to manage-permissions", async () => {
      process.env.OWNER_EMAIL = "user@test.com";
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "team-only", created_by: "other-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarPermission("user-123", "cal-1", "manage-permissions", "org-1");
      expect(result.allowed).toBe(true);
    });

    it("denies non-owner non-creator from manage-permissions", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "manager" }, error: null });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "team-only", created_by: "other-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarPermission("manager-id", "cal-1", "manage-permissions", "org-1");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("manage-permissions - requires owner or creator status");
    });

    it("returns not-allowed when calendar not found during permission check", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "manager" }, error: null });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarPermission("manager-id", "missing-cal", "edit-event", "org-1");
      expect(result.allowed).toBe(false);
    });

    it("handles unknown permission type via default case", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "manager" }, error: null });
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "team-only", created_by: "other-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarPermission(
        "manager-id",
        "cal-1",
        "unknown-permission" as any,
        "org-1",
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Unknown permission");
    });

    it("allows owner to edit-event", async () => {
      process.env.OWNER_EMAIL = "user@test.com";
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "team-only", created_by: "other-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarPermission("user-123", "cal-1", "edit-event", "org-1");
      expect(result.allowed).toBe(true);
    });

    it("allows owner to delete-event", async () => {
      process.env.OWNER_EMAIL = "user@test.com";
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "calendar_configs") {
          return Promise.resolve({
            data: { id: "cal-1", visibility: "team-only", created_by: "other-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const result = await checkCalendarPermission("user-123", "cal-1", "delete-event", "org-1");
      expect(result.allowed).toBe(true);
    });
  });

  describe("getAccessibleCalendars", () => {
    it("returns list of accessible calendars for user role", async () => {
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members") return Promise.resolve({ data: { role: "member" }, error: null });
        if (currentTable === "calendar_configs") {
          if (lastIdQueried === "cal-1") {
            return Promise.resolve({ data: { id: "cal-1", visibility: "public-workspace" }, error: null });
          }
          if (lastIdQueried === "cal-2") {
            return Promise.resolve({ data: { id: "cal-2", visibility: "management-only" }, error: null });
          }
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockQuery.then = vi.fn((resolve) =>
        resolve({
          data: [
            { id: "cal-1", visibility: "public-workspace" },
            { id: "cal-2", visibility: "management-only" },
          ],
          error: null,
        })
      );

      const result = await getAccessibleCalendars("member-id", "org-1");
      expect(result.length).toBe(1);
      expect(result[0]!.id).toBe("cal-1");
    });
  });

  describe("getAccessibleCalendars — bulk permissions (PRF-01)", () => {
    it("grants selected-members calendar via one bulk permission query", async () => {
      process.env.OWNER_EMAIL = "owner@test.com";
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members")
          return Promise.resolve({ data: { role: "member" }, error: null });
        return Promise.resolve({ data: null, error: null });
      });

      mockQuery.then = vi.fn((resolve) => {
        if (currentTable === "calendar_configs") {
          return resolve({
            data: [
              { id: "cal-sel", visibility: "selected-members", created_by: "someone-else" },
              { id: "cal-priv", visibility: "private", created_by: "someone-else" },
            ],
            error: null,
          });
        }
        if (currentTable === "calendar_member_permissions") {
          return resolve({
            data: [{ calendar_id: "cal-sel", member_user_id: "member-id", can_view: true }],
            error: null,
          });
        }
        return resolve({ data: [], error: null });
      });

      const result = await getAccessibleCalendars("member-id", "org-1");
      expect(result.length).toBe(1);
      expect(result[0]!.id).toBe("cal-sel");
      expect(result[0]!.userPermissions).toMatchObject({ can_view: true });

      // Bulk: permissions table hit exactly once, not once per calendar
      const permCalls = mockClient.from.mock.calls.filter(
        (c: string[]) => c[0] === "calendar_member_permissions",
      );
      expect(permCalls.length).toBe(1);
    });
  });

  describe("getAccessibleEvents — bulk visibility (PRF-01)", () => {
    it("applies override in-memory and inherits calendar visibility without per-event queries", async () => {
      process.env.OWNER_EMAIL = "owner@test.com";
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members")
          return Promise.resolve({ data: { role: "member" }, error: null });
        return Promise.resolve({ data: null, error: null });
      });

      mockQuery.then = vi.fn((resolve) => {
        if (currentTable === "calendar_configs") {
          return resolve({
            data: [{ id: "cal-1", visibility: "public-workspace", created_by: "x" }],
            error: null,
          });
        }
        if (currentTable === "calendar_events") {
          return resolve({
            data: [
              { id: "ev-plain", title: "A", event_type: "practice", starts_at: "2026-06-01", ends_at: null, created_by: "x", calendar_id: "cal-1" },
              { id: "ev-mgmt", title: "B", event_type: "meeting", starts_at: "2026-06-02", ends_at: null, created_by: "x", calendar_id: "cal-1" },
            ],
            error: null,
          });
        }
        if (currentTable === "event_visibility") {
          return resolve({
            data: [{ event_id: "ev-mgmt", visibility: "management-only", allowed_member_ids: null }],
            error: null,
          });
        }
        return resolve({ data: [], error: null });
      });

      const result = await getAccessibleEvents("member-id", "org-1", {
        from: "2026-06-01",
        to: "2026-06-30",
      });

      // member sees the plain event (inherits public-workspace calendar),
      // but the management-only override hides ev-mgmt
      expect(result.map((e) => e.id)).toEqual(["ev-plain"]);
      expect(result[0]!.visibility).toBe("public-workspace");

      // Bulk: overrides fetched once, not per event
      const overrideCalls = mockClient.from.mock.calls.filter(
        (c: string[]) => c[0] === "event_visibility",
      );
      expect(overrideCalls.length).toBe(1);
    });

    it("allows manager through management-only override", async () => {
      process.env.OWNER_EMAIL = "owner@test.com";
      mockQuery.single.mockImplementation(() => {
        if (currentTable === "team_members")
          return Promise.resolve({ data: { role: "manager" }, error: null });
        return Promise.resolve({ data: null, error: null });
      });

      mockQuery.then = vi.fn((resolve) => {
        if (currentTable === "calendar_configs") {
          return resolve({
            data: [{ id: "cal-1", visibility: "public-workspace", created_by: "x" }],
            error: null,
          });
        }
        if (currentTable === "calendar_events") {
          return resolve({
            data: [
              { id: "ev-mgmt", title: "B", event_type: "meeting", starts_at: "2026-06-02", ends_at: null, created_by: "x", calendar_id: "cal-1" },
            ],
            error: null,
          });
        }
        if (currentTable === "event_visibility") {
          return resolve({
            data: [{ event_id: "ev-mgmt", visibility: "management-only", allowed_member_ids: null }],
            error: null,
          });
        }
        return resolve({ data: [], error: null });
      });

      const result = await getAccessibleEvents("manager-id", "org-1", {
        from: "2026-06-01",
        to: "2026-06-30",
      });
      expect(result.map((e) => e.id)).toEqual(["ev-mgmt"]);
      expect(result[0]!.visibility).toBe("management-only");
    });
  });

  describe("userCanManageCalendars and PermissionContext", () => {
    it("validates management permissions", async () => {
      mockQuery.single.mockResolvedValueOnce({ data: { role: "coach" }, error: null });
      const canManage = await userCanManageCalendars("coach-id", "org-1");
      expect(canManage).toBe(true);

      mockQuery.single.mockResolvedValueOnce({ data: { role: "member" }, error: null });
      const memberManage = await userCanManageCalendars("member-id", "org-1");
      expect(memberManage).toBe(false);
    });

    it("gets full permission context", async () => {
      mockQuery.single.mockResolvedValueOnce({ data: { role: "manager" }, error: null }); // for getUserRoleInOrg
      mockQuery.single.mockResolvedValueOnce({ data: { role: "manager" }, error: null }); // for userCanManageCalendars
      
      const context = await getPermissionContext("manager-id", "org-1");
      expect(context).toEqual({
        role: "manager",
        orgId: "org-1",
        canManage: true,
      });
    });
  });
});
