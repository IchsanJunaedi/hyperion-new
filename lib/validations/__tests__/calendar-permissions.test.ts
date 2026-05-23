import { describe, it, expect } from "vitest";
import {
  calendarVisibilityEnum,
  createCalendarSchema,
  updateCalendarSchema,
  setCalendarVisibilitySchema,
  grantMemberPermissionSchema,
  revokeMemberPermissionSchema,
  bulkGrantPermissionsSchema,
  setEventVisibilitySchema,
  resetEventVisibilitySchema,
  getCalendarAuditLogsSchema,
} from "../calendar-permissions";

const VALID_UUID = "d3b07384-d113-4956-a5db-88a5b28d63cd";
const INVALID_UUID = "not-a-uuid";
const VALID_VISIBILITIES = [
  "private",
  "management-only",
  "captain-only",
  "team-only",
  "selected-members",
  "public-workspace",
] as const;

describe("calendarVisibilityEnum", () => {
  it("accepts all valid visibility values", () => {
    for (const v of VALID_VISIBILITIES) {
      expect(calendarVisibilityEnum.safeParse(v).success).toBe(true);
    }
  });

  it("rejects invalid visibility value", () => {
    expect(calendarVisibilityEnum.safeParse("all").success).toBe(false);
  });
});

describe("createCalendarSchema", () => {
  const base = { title: "Training Calendar", visibility: "team-only" as const };

  it("accepts valid minimal input", () => {
    expect(createCalendarSchema.safeParse(base).success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(createCalendarSchema.safeParse({ ...base, title: "" }).success).toBe(false);
  });

  it("rejects title exceeding 200 chars", () => {
    expect(createCalendarSchema.safeParse({ ...base, title: "x".repeat(201) }).success).toBe(false);
  });

  it("trims whitespace from title", () => {
    const result = createCalendarSchema.safeParse({ ...base, title: "  Hello  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Hello");
  });

  it("transforms empty description to null", () => {
    const result = createCalendarSchema.safeParse({ ...base, description: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBeNull();
  });

  it("accepts non-empty description", () => {
    const result = createCalendarSchema.safeParse({ ...base, description: "Weekly practice" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBe("Weekly practice");
  });

  it("rejects description exceeding 1000 chars", () => {
    expect(createCalendarSchema.safeParse({ ...base, description: "x".repeat(1001) }).success).toBe(false);
  });

  it("defaults selectedMemberIds to empty array", () => {
    const result = createCalendarSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.selectedMemberIds).toEqual([]);
  });

  it("accepts valid UUID array in selectedMemberIds", () => {
    const result = createCalendarSchema.safeParse({ ...base, selectedMemberIds: [VALID_UUID] });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID in selectedMemberIds", () => {
    expect(createCalendarSchema.safeParse({ ...base, selectedMemberIds: [INVALID_UUID] }).success).toBe(false);
  });

  it("rejects invalid visibility", () => {
    expect(createCalendarSchema.safeParse({ ...base, visibility: "all" }).success).toBe(false);
  });
});

describe("updateCalendarSchema", () => {
  const base = { id: VALID_UUID };

  it("accepts valid minimal input (id only)", () => {
    expect(updateCalendarSchema.safeParse(base).success).toBe(true);
  });

  it("rejects invalid UUID for id", () => {
    expect(updateCalendarSchema.safeParse({ id: INVALID_UUID }).success).toBe(false);
  });

  it("rejects title shorter than 1 char when provided", () => {
    expect(updateCalendarSchema.safeParse({ ...base, title: "" }).success).toBe(false);
  });

  it("transforms empty description to null", () => {
    const result = updateCalendarSchema.safeParse({ ...base, description: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBeNull();
  });

  it("coerces isActive to boolean", () => {
    const result = updateCalendarSchema.safeParse({ ...base, isActive: "true" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isActive).toBe(true);
  });

  it("accepts optional visibility", () => {
    const result = updateCalendarSchema.safeParse({ ...base, visibility: "private" });
    expect(result.success).toBe(true);
  });
});

describe("setCalendarVisibilitySchema", () => {
  const base = { calendarId: VALID_UUID, visibility: "team-only" as const };

  it("accepts valid input", () => {
    expect(setCalendarVisibilitySchema.safeParse(base).success).toBe(true);
  });

  it("rejects invalid calendarId", () => {
    expect(setCalendarVisibilitySchema.safeParse({ ...base, calendarId: INVALID_UUID }).success).toBe(false);
  });

  it("defaults selectedMemberIds to empty array", () => {
    const result = setCalendarVisibilitySchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.selectedMemberIds).toEqual([]);
  });

  it("accepts valid UUID array in selectedMemberIds", () => {
    const result = setCalendarVisibilitySchema.safeParse({ ...base, selectedMemberIds: [VALID_UUID] });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID in selectedMemberIds", () => {
    expect(setCalendarVisibilitySchema.safeParse({ ...base, selectedMemberIds: [INVALID_UUID] }).success).toBe(false);
  });
});

describe("grantMemberPermissionSchema", () => {
  const base = { calendarId: VALID_UUID, memberUserId: VALID_UUID };

  it("accepts valid minimal input with defaults", () => {
    const result = grantMemberPermissionSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.canView).toBe(true);
      expect(result.data.canCreateEvent).toBe(false);
      expect(result.data.canEditEvent).toBe(false);
      expect(result.data.canDeleteEvent).toBe(false);
      expect(result.data.canManagePermissions).toBe(false);
    }
  });

  it("rejects invalid calendarId", () => {
    expect(grantMemberPermissionSchema.safeParse({ ...base, calendarId: INVALID_UUID }).success).toBe(false);
  });

  it("rejects invalid memberUserId", () => {
    expect(grantMemberPermissionSchema.safeParse({ ...base, memberUserId: INVALID_UUID }).success).toBe(false);
  });

  it("coerces numeric 1/0 to boolean for permission flags", () => {
    const result = grantMemberPermissionSchema.safeParse({
      ...base,
      canCreateEvent: 1,
      canEditEvent: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.canCreateEvent).toBe(true);
      expect(result.data.canEditEvent).toBe(false);
    }
  });
});

describe("revokeMemberPermissionSchema", () => {
  it("accepts valid input", () => {
    expect(revokeMemberPermissionSchema.safeParse({ calendarId: VALID_UUID, memberUserId: VALID_UUID }).success).toBe(true);
  });

  it("rejects invalid calendarId", () => {
    expect(revokeMemberPermissionSchema.safeParse({ calendarId: INVALID_UUID, memberUserId: VALID_UUID }).success).toBe(false);
  });

  it("rejects invalid memberUserId", () => {
    expect(revokeMemberPermissionSchema.safeParse({ calendarId: VALID_UUID, memberUserId: INVALID_UUID }).success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(revokeMemberPermissionSchema.safeParse({ calendarId: VALID_UUID }).success).toBe(false);
  });
});

describe("bulkGrantPermissionsSchema", () => {
  const base = {
    calendarId: VALID_UUID,
    memberIds: [VALID_UUID],
    permissions: {},
  };

  it("accepts valid input", () => {
    expect(bulkGrantPermissionsSchema.safeParse(base).success).toBe(true);
  });

  it("rejects empty memberIds array", () => {
    expect(bulkGrantPermissionsSchema.safeParse({ ...base, memberIds: [] }).success).toBe(false);
  });

  it("rejects invalid UUID in memberIds", () => {
    expect(bulkGrantPermissionsSchema.safeParse({ ...base, memberIds: [INVALID_UUID] }).success).toBe(false);
  });

  it("rejects invalid calendarId", () => {
    expect(bulkGrantPermissionsSchema.safeParse({ ...base, calendarId: INVALID_UUID }).success).toBe(false);
  });

  it("accepts multiple valid UUIDs in memberIds", () => {
    const result = bulkGrantPermissionsSchema.safeParse({
      ...base,
      memberIds: [VALID_UUID, "a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts all permission flags set to true", () => {
    const result = bulkGrantPermissionsSchema.safeParse({
      ...base,
      permissions: {
        canView: true,
        canCreateEvent: true,
        canEditEvent: true,
        canDeleteEvent: true,
        canManagePermissions: true,
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("setEventVisibilitySchema", () => {
  const base = { eventId: VALID_UUID };

  it("accepts valid minimal input", () => {
    expect(setEventVisibilitySchema.safeParse(base).success).toBe(true);
  });

  it("rejects invalid eventId", () => {
    expect(setEventVisibilitySchema.safeParse({ eventId: INVALID_UUID }).success).toBe(false);
  });

  it("defaults allowedMemberIds to empty array", () => {
    const result = setEventVisibilitySchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.allowedMemberIds).toEqual([]);
  });

  it("accepts optional visibility", () => {
    const result = setEventVisibilitySchema.safeParse({ ...base, visibility: "management-only" });
    expect(result.success).toBe(true);
  });

  it("accepts valid UUID array in allowedMemberIds", () => {
    const result = setEventVisibilitySchema.safeParse({ ...base, allowedMemberIds: [VALID_UUID] });
    expect(result.success).toBe(true);
  });
});

describe("resetEventVisibilitySchema", () => {
  it("accepts valid eventId", () => {
    expect(resetEventVisibilitySchema.safeParse({ eventId: VALID_UUID }).success).toBe(true);
  });

  it("rejects invalid eventId", () => {
    expect(resetEventVisibilitySchema.safeParse({ eventId: INVALID_UUID }).success).toBe(false);
  });

  it("rejects missing eventId", () => {
    expect(resetEventVisibilitySchema.safeParse({}).success).toBe(false);
  });
});

describe("getCalendarAuditLogsSchema", () => {
  it("accepts empty input with defaults", () => {
    const result = getCalendarAuditLogsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
    }
  });

  it("accepts valid calendarId UUID", () => {
    expect(getCalendarAuditLogsSchema.safeParse({ calendarId: VALID_UUID }).success).toBe(true);
  });

  it("rejects invalid calendarId UUID", () => {
    expect(getCalendarAuditLogsSchema.safeParse({ calendarId: INVALID_UUID }).success).toBe(false);
  });

  it("rejects limit below 1", () => {
    expect(getCalendarAuditLogsSchema.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("rejects limit above 1000", () => {
    expect(getCalendarAuditLogsSchema.safeParse({ limit: 1001 }).success).toBe(false);
  });

  it("rejects negative offset", () => {
    expect(getCalendarAuditLogsSchema.safeParse({ offset: -1 }).success).toBe(false);
  });

  it("coerces string numbers for limit and offset", () => {
    const result = getCalendarAuditLogsSchema.safeParse({ limit: "100", offset: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.offset).toBe(10);
    }
  });

  it("accepts optional eventId", () => {
    expect(getCalendarAuditLogsSchema.safeParse({ eventId: VALID_UUID }).success).toBe(true);
  });

  it("rejects invalid eventId UUID", () => {
    expect(getCalendarAuditLogsSchema.safeParse({ eventId: INVALID_UUID }).success).toBe(false);
  });
});
