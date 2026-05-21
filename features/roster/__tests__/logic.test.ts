import { describe, it, expect } from "vitest";
import {
  sortMembersByRole,
  filterMembersByDivision,
  getMemberDisplayName,
  canAssignRole,
} from "../logic";
import type { RosterMember } from "../queries";

// Helper to synthesize a basic RosterMember
const makeMember = (
  id: string,
  role: RosterMember["role"],
  joined_at: string,
  division_id: string | null = null,
  display_name: string | null = null,
  username: string | null = null,
  jersey_number: number | null = null,
): RosterMember => ({
  id,
  user_id: `user-${id}`,
  role,
  joined_at,
  division_id,
  division_name: null,
  display_name,
  username,
  jersey_number,
  position: null,
  availability: "available",
  main_role: null,
  avatar_url: null,
  phone_wa: null,
  game_ids: {},
});

describe("sortMembersByRole", () => {
  it("returns empty array for empty input", () => {
    expect(sortMembersByRole([])).toEqual([]);
  });

  it("sorts mixed roles based on priority (owner > manager > coach > captain > member)", () => {
    const members = [
      makeMember("1", "member", "2026-01-01"),
      makeMember("2", "manager", "2026-01-01"),
      makeMember("3", "owner", "2026-01-01"),
      makeMember("4", "captain", "2026-01-01"),
      makeMember("5", "coach", "2026-01-01"),
    ];
    const sorted = sortMembersByRole(members);
    expect(sorted.map((m) => m.role)).toEqual([
      "owner",
      "manager",
      "coach",
      "captain",
      "member",
    ]);
  });

  it("breaks ties using joined_at (earliest first)", () => {
    const members = [
      makeMember("late", "member", "2026-05-15T12:00:00Z"),
      makeMember("early", "member", "2026-01-10T08:00:00Z"),
      makeMember("mid", "member", "2026-03-20T10:00:00Z"),
    ];
    const sorted = sortMembersByRole(members);
    expect(sorted.map((m) => m.id)).toEqual(["early", "mid", "late"]);
  });

  it("handles unknown roles by defaulting their priority to 0", () => {
    const members = [
      makeMember("1", "unknown-role" as any, "2026-01-01"),
      makeMember("2", "member", "2026-01-01"),
    ];
    const sorted = sortMembersByRole(members);
    expect(sorted.map((m) => m.id)).toEqual(["2", "1"]);
  });
});

describe("filterMembersByDivision", () => {
  const members = [
    makeMember("1", "member", "2026", "div-A"),
    makeMember("2", "member", "2026", "div-B"),
    makeMember("3", "member", "2026", null),
  ];

  it("filters members of a specific division", () => {
    const result = filterMembersByDivision(members, "div-A");
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe("1");
  });

  it("filters members with no division (null division_id)", () => {
    const result = filterMembersByDivision(members, null);
    expect(result.length).toBe(1);
    expect(result[0]!.id).toBe("3");
  });

  it("returns empty array when no members match division", () => {
    const result = filterMembersByDivision(members, "div-C");
    expect(result).toEqual([]);
  });

  it("returns empty array when filtering an empty array", () => {
    expect(filterMembersByDivision([], "div-A")).toEqual([]);
  });
});

describe("getMemberDisplayName", () => {
  it("formats name using display_name when present", () => {
    const name = getMemberDisplayName({ display_name: "John Doe" });
    expect(name).toBe("John Doe");
  });

  it("formats name using username when display_name is missing", () => {
    const name = getMemberDisplayName({ display_name: "", username: "johndoe12" });
    expect(name).toBe("johndoe12");
  });

  it("returns Anonymous Player when both names are missing", () => {
    const name = getMemberDisplayName({ display_name: null, username: undefined });
    expect(name).toBe("Anonymous Player");
  });

  it("trims whitespace from name", () => {
    const name = getMemberDisplayName({ display_name: "  Spaced Name   " });
    expect(name).toBe("Spaced Name");
  });

  it("appends jersey number when provided", () => {
    const name = getMemberDisplayName({
      display_name: "Lemon",
      jersey_number: 77,
    });
    expect(name).toBe("#77 Lemon");
  });

  it("appends jersey number of 0 correctly", () => {
    const name = getMemberDisplayName({
      display_name: "Lemon",
      jersey_number: 0,
    });
    expect(name).toBe("#0 Lemon");
  });
});

describe("canAssignRole", () => {
  describe("Owner permissions", () => {
    it("allows owner to assign manager, coach, captain, and member", () => {
      expect(canAssignRole("owner", "manager")).toBe(true);
      expect(canAssignRole("owner", "coach")).toBe(true);
      expect(canAssignRole("owner", "captain")).toBe(true);
      expect(canAssignRole("owner", "member")).toBe(true);
    });

    it("prevents owner from assigning another owner", () => {
      expect(canAssignRole("owner", "owner")).toBe(false);
    });
  });

  describe("Manager permissions", () => {
    it("allows manager to assign captain and member", () => {
      expect(canAssignRole("manager", "captain")).toBe(true);
      expect(canAssignRole("manager", "member")).toBe(true);
    });

    it("prevents manager from assigning owner, manager, or coach", () => {
      expect(canAssignRole("manager", "owner")).toBe(false);
      expect(canAssignRole("manager", "manager")).toBe(false);
      expect(canAssignRole("manager", "coach")).toBe(false);
    });
  });

  describe("Other roles permissions", () => {
    it("prevents coach, captain, and member from assigning any roles", () => {
      const nonAuthorizeRoles: RosterMember["role"][] = ["coach", "captain", "member"];
      const targetRoles: RosterMember["role"][] = ["owner", "manager", "coach", "captain", "member"];

      for (const current of nonAuthorizeRoles) {
        for (const target of targetRoles) {
          expect(canAssignRole(current, target)).toBe(false);
        }
      }
    });
  });
});
