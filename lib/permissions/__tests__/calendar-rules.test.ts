import { describe, it, expect } from "vitest";
import {
  resolvePermissions,
  isRoleHigherOrEqual,
  canViewCalendar,
  canCreateEvents,
  canManageCalendar,
  canManagePermissions,
} from "@/lib/permissions/calendar-rules";

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
