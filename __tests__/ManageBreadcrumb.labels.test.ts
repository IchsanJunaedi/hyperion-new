import { describe, it, expect } from "vitest";

const SUB_ROUTE_LABELS: Record<string, string> = {
  "": "Overview",
  "/assign": "Tambah Member",
  "/divisions": "Edit Divisi",
  "/captains": "Edit Captain",
  "/finances": "Kas Tim",
  "/sponsors": "Sponsor",
  "/content": "Konten",
  "/development": "Player Dev",
  "/salaries": "Salary Player",
  "/reports": "Laporan",
};

function getManageLabel(pathname: string): string {
  const match = pathname.match(/^\/manage\/[^/]+(\/.*)?$/);
  if (!match) return "Manager Panel";
  const sub = match[1] ?? "";
  const topSub = sub.replace(/^(\/[^/]+).*$/, "$1");
  return SUB_ROUTE_LABELS[topSub] ?? "Manager Panel";
}

describe("getManageLabel", () => {
  it("overview", () => {
    expect(getManageLabel("/manage/rrq")).toBe("Overview");
  });
  it("assign sub-route", () => {
    expect(getManageLabel("/manage/rrq/assign")).toBe("Tambah Member");
  });
  it("sponsors detail", () => {
    expect(getManageLabel("/manage/rrq/sponsors/abc-123")).toBe("Sponsor");
  });
  it("unknown route", () => {
    expect(getManageLabel("/manage/rrq/unknown")).toBe("Manager Panel");
  });
});
