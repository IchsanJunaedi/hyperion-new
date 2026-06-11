import { describe, it, expect, vi } from "vitest";
import { assignRoles } from "../data/roleAssignment";

// Stub server-only modules
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("assignRoles weight optimization", () => {
  it("assigns Our Draft heroes correctly: Lukas (Fighter), Zetian (Mage), Alice (Mage), Irithel (Marksman), Belerick (Tank)", () => {
    const heroes = ["Lukas", "Zetian", "Alice", "Irithel", "Belerick"];
    const roles = assignRoles(heroes);

    const assignmentMap = Object.fromEntries(heroes.map((h, i) => [h, roles[i]]));

    expect(assignmentMap["Irithel"]).toBe("gold_lane");
    expect(assignmentMap["Belerick"]).toBe("roamer");
    expect(assignmentMap["Lukas"]).toBe("jungler");
    
    // Both Alice and Zetian are Mages (so one goes Mid, one goes EXP)
    const mageRoles = [assignmentMap["Alice"], assignmentMap["Zetian"]];
    expect(mageRoles).toContain("mid_lane");
    expect(mageRoles).toContain("exp_lane");
  });

  it("assigns Enemy Draft heroes correctly: Minsitthar (Fighter), Gusion (Assassin), Fredrinn (Fighter), Karrie (Marksman), Grock (Tank)", () => {
    const heroes = ["Minsitthar", "Gusion", "Fredrinn", "Karrie", "Grock"];
    const roles = assignRoles(heroes);

    const assignmentMap = Object.fromEntries(heroes.map((h, i) => [h, roles[i]]));

    expect(assignmentMap["Karrie"]).toBe("gold_lane");
    expect(assignmentMap["Grock"]).toBe("roamer");
    expect(assignmentMap["Gusion"]).toBe("mid_lane");

    // Both Minsitthar and Fredrinn are Fighters (so one goes EXP, one goes Jungler)
    const fighterRoles = [assignmentMap["Minsitthar"], assignmentMap["Fredrinn"]];
    expect(fighterRoles).toContain("exp_lane");
    expect(fighterRoles).toContain("jungler");
  });
});
