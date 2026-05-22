/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  logCalendarAudit,
  logCalendarCreated,
  logCalendarUpdated,
  logCalendarDeleted,
  logEventCreated,
  logEventUpdated,
  logEventDeleted,
  logEventVisibilityChanged,
  logPermissionGranted,
  logPermissionRevoked,
  logPermissionUpdated,
  getCalendarAuditLogs,
  getCalendarChanges,
  getEventChanges,
  getCalendarPermissionHistory,
  getUserActivityLogs,
  AUDIT_ACTIONS,
} from "../calendar-audit";
import { createAdminClient } from "@/lib/supabase/admin";

describe("Calendar Audit Logging", () => {
  let mockAdminClient: any;
  let mockQuery: any;
  let currentTable = "";

  beforeEach(() => {
    vi.clearAllMocks();
    currentTable = "";

    mockQuery = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) =>
        resolve({
          data: [],
          error: null,
        })
      ),
    };

    mockAdminClient = {
      from: vi.fn().mockImplementation((table) => {
        currentTable = table;
        return mockQuery;
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as any);
  });

  describe("logCalendarAudit", () => {
    it("inserts a log entry into calendar_audit_logs", async () => {
      await logCalendarAudit(
        "org-123",
        "calendar_created",
        "calendar",
        "cal-123",
        "actor-123",
        { title: { new_value: "My Calendar" } },
        { source: "web" }
      );

      expect(mockAdminClient.from).toHaveBeenCalledWith("calendar_audit_logs");
      expect(mockQuery.insert).toHaveBeenCalledWith({
        organization_id: "org-123",
        calendar_id: "cal-123",
        event_id: null,
        actor_id: "actor-123",
        action: "calendar_created",
        entity_type: "calendar",
        changes: { title: { new_value: "My Calendar" } },
        metadata: { source: "web" },
      });
    });

    it("fails silently and catches errors", async () => {
      mockQuery.insert.mockRejectedValue(new Error("Database offline"));

      // Should not throw exception
      await expect(
        logCalendarAudit("org-1", "calendar_created", "calendar", "cal-1", "actor-1")
      ).resolves.not.toThrow();
    });
  });

  describe("Specialized Loggers", () => {
    it("logCalendarCreated logs details correctly", async () => {
      await logCalendarCreated("org-1", "cal-1", "actor-1", {
        title: "Main",
        visibility: "team-only",
        description: "Desc",
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.CALENDAR_CREATED,
          changes: {
            title: { new_value: "Main" },
            visibility: { new_value: "team-only" },
            description: { new_value: "Desc" },
          },
        })
      );
    });

    it("logCalendarUpdated logs only changed properties", async () => {
      const oldData = { title: "Old Title", visibility: "private", status: "active" };
      const newData = { title: "New Title", visibility: "private", status: "inactive" };

      await logCalendarUpdated("org-1", "cal-1", "actor-1", oldData, newData);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.CALENDAR_UPDATED,
          changes: {
            title: { old_value: "Old Title", new_value: "New Title" },
            status: { old_value: "active", new_value: "inactive" },
          },
        })
      );
    });

    it("logCalendarDeleted sets deleted_at with ISO date string", async () => {
      await logCalendarDeleted("org-1", "cal-1", "actor-1", true, { reason: "cleanup" });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.CALENDAR_DELETED,
          changes: expect.objectContaining({
            deleted_at: expect.objectContaining({
              new_value: expect.any(String),
            }),
          }),
          metadata: { reason: "cleanup", softDelete: true },
        })
      );
    });

    it("logEventCreated inserts event metadata", async () => {
      await logEventCreated("org-1", "evt-1", "cal-1", "actor-1", {
        title: "Match",
        event_type: "scrim",
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.EVENT_CREATED,
          entity_type: "event",
          calendar_id: "cal-1",
          event_id: "evt-1",
        })
      );
    });

    it("logEventUpdated records modified fields", async () => {
      await logEventUpdated(
        "org-1",
        "evt-1",
        "cal-1",
        "actor-1",
        { title: "Old Title" },
        { title: "New Title" }
      );

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.EVENT_UPDATED,
          changes: {
            title: { old_value: "Old Title", new_value: "New Title" },
          },
        })
      );
    });

    it("logEventDeleted records deletions", async () => {
      await logEventDeleted("org-1", "evt-1", "cal-1", "actor-1");

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.EVENT_DELETED,
          entity_type: "event",
        })
      );
    });

    it("logEventVisibilityChanged records visibility changes", async () => {
      await logEventVisibilityChanged("org-1", "evt-1", "cal-1", "actor-1", "private", "team-only");

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.EVENT_VISIBILITY_CHANGED,
          changes: {
            visibility: { old_value: "private", new_value: "team-only" },
          },
        })
      );
    });

    it("logPermissionGranted records permissions changes", async () => {
      const perms = { can_view: true, can_create_event: false };
      await logPermissionGranted("org-1", "cal-1", "actor-1", "user-2", perms);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.PERMISSION_GRANTED,
          entity_type: "permission",
          metadata: { member_user_id: "user-2" },
        })
      );
    });

    it("logPermissionRevoked records cancellation", async () => {
      await logPermissionRevoked("org-1", "cal-1", "actor-1", "user-2");

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.PERMISSION_REVOKED,
          metadata: { member_user_id: "user-2" },
        })
      );
    });

    it("logPermissionUpdated records updates", async () => {
      await logPermissionUpdated(
        "org-1",
        "cal-1",
        "actor-1",
        "user-2",
        { can_view: true },
        { can_view: false }
      );

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AUDIT_ACTIONS.PERMISSION_UPDATED,
          changes: {
            can_view: { old_value: true, new_value: false },
          },
        })
      );
    });
  });

  describe("Audit Retrieval Functions", () => {
    it("getCalendarAuditLogs applies filters and returns rows", async () => {
      const filters = {
        calendarId: "cal-1",
        eventId: "evt-1",
        action: AUDIT_ACTIONS.CALENDAR_CREATED,
        actor: "actor-1",
        entityType: "calendar" as const,
        fromDate: "2026-01-01",
        toDate: "2026-02-01",
      };

      const result = await getCalendarAuditLogs("org-1", filters, 50);

      expect(mockAdminClient.from).toHaveBeenCalledWith("calendar_audit_logs");
      expect(mockQuery.eq).toHaveBeenCalledWith("organization_id", "org-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("calendar_id", "cal-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("event_id", "evt-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("action", AUDIT_ACTIONS.CALENDAR_CREATED);
      expect(mockQuery.eq).toHaveBeenCalledWith("actor_id", "actor-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("entity_type", "calendar");
      expect(mockQuery.gte).toHaveBeenCalledWith("created_at", "2026-01-01");
      expect(mockQuery.lte).toHaveBeenCalledWith("created_at", "2026-02-01");
      expect(mockQuery.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual([]);
    });

    it("getCalendarChanges calls getCalendarAuditLogs with calendarId", async () => {
      const result = await getCalendarChanges("org-1", "cal-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("calendar_id", "cal-1");
      expect(result).toEqual([]);
    });

    it("getEventChanges calls getCalendarAuditLogs with eventId", async () => {
      const result = await getEventChanges("org-1", "evt-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("event_id", "evt-1");
      expect(result).toEqual([]);
    });

    it("getCalendarPermissionHistory queries database for calendar permission logs", async () => {
      const result = await getCalendarPermissionHistory("org-1", "cal-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("calendar_id", "cal-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("entity_type", "permission");
      expect(result).toEqual([]);
    });

    it("getUserActivityLogs queries database for actor activity logs", async () => {
      const result = await getUserActivityLogs("org-1", "actor-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("actor_id", "actor-1");
      expect(result).toEqual([]);
    });
  });
});
