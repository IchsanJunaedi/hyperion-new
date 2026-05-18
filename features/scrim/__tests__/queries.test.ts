import { describe, it, expect } from "vitest";
import { summarizeAttendance } from "@/features/scrim/queries";
import type { ScrimDetail } from "@/features/scrim/queries";

type AttendanceRow = ScrimDetail["attendances"][number];
type AttStatus = "confirmed" | "declined" | "tentative" | "pending";

// summarizeAttendance only reads r.attendance.status — cast is safe
const makeRow = (userId: string, status: AttStatus): AttendanceRow => ({
  attendance: { status } as AttendanceRow["attendance"],
  member: {
    user_id: userId,
    display_name: `Player ${userId}`,
    avatar_url: null,
    jersey_number: null,
    position: null,
  },
});

describe("summarizeAttendance", () => {
  it("returns all zeros for empty array", () => {
    const result = summarizeAttendance([]);
    expect(result).toEqual({ confirmed: 0, declined: 0, tentative: 0, pending: 0 });
  });

  it("counts a single confirmed attendance", () => {
    const result = summarizeAttendance([makeRow("u1", "confirmed")]);
    expect(result.confirmed).toBe(1);
    expect(result.declined).toBe(0);
    expect(result.tentative).toBe(0);
    expect(result.pending).toBe(0);
  });

  it("counts mixed statuses correctly", () => {
    const rows = [
      makeRow("u1", "confirmed"),
      makeRow("u2", "confirmed"),
      makeRow("u3", "declined"),
      makeRow("u4", "tentative"),
      makeRow("u5", "pending"),
      makeRow("u6", "pending"),
    ];
    const result = summarizeAttendance(rows);
    expect(result.confirmed).toBe(2);
    expect(result.declined).toBe(1);
    expect(result.tentative).toBe(1);
    expect(result.pending).toBe(2);
  });

  it("total count equals number of attendances", () => {
    const rows = [
      makeRow("u1", "confirmed"),
      makeRow("u2", "declined"),
      makeRow("u3", "tentative"),
    ];
    const result = summarizeAttendance(rows);
    const total = result.confirmed + result.declined + result.tentative + result.pending;
    expect(total).toBe(3);
  });
});
