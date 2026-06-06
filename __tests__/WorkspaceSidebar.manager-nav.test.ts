import { describe, it, expect } from "vitest";
import { getManagerNavGroup } from "@/components/layout/WorkspaceSidebar";

describe("getManagerNavGroup", () => {
  it("uses orgSlug in overview href", () => {
    const group = getManagerNavGroup("rrq-hoshi");
    const overview = group.items.find((i) => i.key === "manage-overview");
    expect(overview?.absoluteHref).toBe("/manage/rrq-hoshi");
  });

  it("uses orgSlug in assign href", () => {
    const group = getManagerNavGroup("evos");
    const assign = group.items.find((i) => i.key === "manage-assign");
    expect(assign?.absoluteHref).toBe("/manage/evos/assign");
  });

  it("overview has exactMatch true", () => {
    const group = getManagerNavGroup("rrq");
    const overview = group.items.find((i) => i.key === "manage-overview");
    expect(overview?.exactMatch).toBe(true);
  });
});
