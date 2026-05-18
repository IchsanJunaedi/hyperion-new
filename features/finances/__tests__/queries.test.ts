import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFinanceSummary } from "@/features/finances/queries";

// Test the pure finance logic without hitting the database
describe("getFinanceSummary", () => {
  const mockRows = [
    {
      id: "1",
      amount: 500000,
      type: "income" as const,
      category: "iuran",
      description: "Iuran bulan Mei",
      date: "2026-05-01",
      member_id: null,
      organization_id: "org-1",
      created_at: new Date().toISOString(),
      created_by: "user-1",
      balance_after: 500000,
    },
    {
      id: "2",
      amount: 200000,
      type: "expense" as const,
      category: "operasional",
      description: "Beli headset",
      date: "2026-05-15",
      member_id: null,
      organization_id: "org-1",
      created_at: new Date().toISOString(),
      created_by: "user-1",
      balance_after: 300000,
    },
  ];

  it("calculates total income correctly", async () => {
    const summary = await getFinanceSummary("org-1", 2026, 5, mockRows);
    expect(summary.totalIncome).toBe(500000);
  });

  it("calculates total expense correctly", async () => {
    const summary = await getFinanceSummary("org-1", 2026, 5, mockRows);
    expect(summary.totalExpense).toBe(200000);
  });

  it("calculates net balance correctly", async () => {
    const summary = await getFinanceSummary("org-1", 2026, 5, mockRows);
    // openingBalance is 0 (mocked admin returns empty), so balance = 500000 - 200000
    expect(summary.balance).toBe(300000);
  });

  it("returns 0 for all values when rows are empty", async () => {
    const summary = await getFinanceSummary("org-1", 2026, 5, []);
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpense).toBe(0);
    expect(summary.balance).toBe(0);
  });
});

describe("getFinanceSummary — edge cases", () => {
  it("handles all expenses (no income)", async () => {
    const rows = [
      {
        id: "1",
        amount: 300000,
        type: "expense" as const,
        category: "operasional",
        description: null,
        date: "2026-05-15",
        member_id: null,
        organization_id: "org-1",
        created_at: new Date().toISOString(),
        created_by: "user-1",
        balance_after: -300000,
      },
    ];
    const summary = await getFinanceSummary("org-1", 2026, 5, rows);
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpense).toBe(300000);
    expect(summary.balance).toBe(-300000);
  });

  it("sums multiple income entries correctly", async () => {
    const rows = [
      {
        id: "1",
        amount: 100000,
        type: "income" as const,
        category: "Iuran",
        description: null,
        date: "2026-05-01",
        member_id: null,
        organization_id: "org-1",
        created_at: new Date().toISOString(),
        created_by: "user-1",
        balance_after: 100000,
      },
      {
        id: "2",
        amount: 200000,
        type: "income" as const,
        category: "Sponsor",
        description: null,
        date: "2026-05-10",
        member_id: null,
        organization_id: "org-1",
        created_at: new Date().toISOString(),
        created_by: "user-1",
        balance_after: 300000,
      },
    ];
    const summary = await getFinanceSummary("org-1", 2026, 5, rows);
    expect(summary.totalIncome).toBe(300000);
    expect(summary.totalExpense).toBe(0);
    expect(summary.balance).toBe(300000);
  });
});
