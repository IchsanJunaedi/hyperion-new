import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFinanceSummary, listFinances } from "../queries";
import { createAdminClient } from "@/lib/supabase/admin";

vi.mock("server-only", () => ({}));

describe("Finance Calculations and Queries", () => {
  let mockFrom: any;
  let mockAdmin: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };
    mockAdmin = {
      from: vi.fn().mockReturnValue(mockFrom),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockAdmin as any);
  });

  describe("getFinanceSummary", () => {
    const mockCurrentRows = [
      {
        id: "c1",
        amount: 1000,
        type: "income" as const,
        category: "iuran",
        description: null,
        date: "2026-05-05",
        member_id: null,
        organization_id: "org-123",
        created_at: "",
        created_by: "",
        balance_after: 0,
      },
      {
        id: "c2",
        amount: 300,
        type: "expense" as const,
        category: "operasional",
        description: null,
        date: "2026-05-10",
        member_id: null,
        organization_id: "org-123",
        created_at: "",
        created_by: "",
        balance_after: 0,
      },
    ];

    it("calculates balance with zero opening balance and empty current rows", async () => {
      mockFrom.then = vi.fn((resolve) => resolve({ data: [], error: null }));

      const summary = await getFinanceSummary("org-123", 2026, 5, []);
      expect(summary).toEqual({
        openingBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      });
    });

    it("calculates balance with positive opening balance and empty current rows", async () => {
      const prevData = [
        { type: "income", amount: 5000 },
        { type: "expense", amount: 1500 },
      ];
      mockFrom.then = vi.fn((resolve) => resolve({ data: prevData, error: null }));

      const summary = await getFinanceSummary("org-123", 2026, 5, []);
      expect(summary).toEqual({
        openingBalance: 3500,
        totalIncome: 0,
        totalExpense: 0,
        balance: 3500,
      });
    });

    it("calculates balance with negative opening balance and empty current rows", async () => {
      const prevData = [
        { type: "income", amount: 1000 },
        { type: "expense", amount: 2500 },
      ];
      mockFrom.then = vi.fn((resolve) => resolve({ data: prevData, error: null }));

      const summary = await getFinanceSummary("org-123", 2026, 5, []);
      expect(summary).toEqual({
        openingBalance: -1500,
        totalIncome: 0,
        totalExpense: 0,
        balance: -1500,
      });
    });

    it("calculates balance with zero opening balance and only income current rows", async () => {
      mockFrom.then = vi.fn((resolve) => resolve({ data: [], error: null }));

      const onlyIncome = [mockCurrentRows[0]];
      const summary = await getFinanceSummary("org-123", 2026, 5, onlyIncome);
      expect(summary).toEqual({
        openingBalance: 0,
        totalIncome: 1000,
        totalExpense: 0,
        balance: 1000,
      });
    });

    it("calculates balance with zero opening balance and only expense current rows", async () => {
      mockFrom.then = vi.fn((resolve) => resolve({ data: [], error: null }));

      const onlyExpense = [mockCurrentRows[1]];
      const summary = await getFinanceSummary("org-123", 2026, 5, onlyExpense);
      expect(summary).toEqual({
        openingBalance: 0,
        totalIncome: 0,
        totalExpense: 300,
        balance: -300,
      });
    });

    it("calculates balance with zero opening balance and mixed current rows", async () => {
      mockFrom.then = vi.fn((resolve) => resolve({ data: [], error: null }));

      const summary = await getFinanceSummary("org-123", 2026, 5, mockCurrentRows);
      expect(summary).toEqual({
        openingBalance: 0,
        totalIncome: 1000,
        totalExpense: 300,
        balance: 700,
      });
    });

    it("calculates balance with positive opening balance and mixed current rows", async () => {
      const prevData = [{ type: "income", amount: 2000 }];
      mockFrom.then = vi.fn((resolve) => resolve({ data: prevData, error: null }));

      const summary = await getFinanceSummary("org-123", 2026, 5, mockCurrentRows);
      expect(summary).toEqual({
        openingBalance: 2000,
        totalIncome: 1000,
        totalExpense: 300,
        balance: 2700,
      });
    });

    it("calculates balance with negative opening balance and mixed current rows", async () => {
      const prevData = [{ type: "expense", amount: 500 }];
      mockFrom.then = vi.fn((resolve) => resolve({ data: prevData, error: null }));

      const summary = await getFinanceSummary("org-123", 2026, 5, mockCurrentRows);
      expect(summary).toEqual({
        openingBalance: -500,
        totalIncome: 1000,
        totalExpense: 300,
        balance: 200,
      });
    });

    it("handles database error on opening balance gracefully", async () => {
      mockFrom.then = vi.fn((resolve) => resolve({ data: null, error: { message: "DB Error" } }));

      const summary = await getFinanceSummary("org-123", 2026, 5, mockCurrentRows);
      expect(summary).toEqual({
        openingBalance: 0, // defaults to 0 on null/error data
        totalIncome: 1000,
        totalExpense: 300,
        balance: 700,
      });
    });

    it("handles large amounts and floating points without throwing errors", async () => {
      const prevData = [{ type: "income", amount: 10000000000.5 }];
      mockFrom.then = vi.fn((resolve) => resolve({ data: prevData, error: null }));

      const largeRows = [
        {
          ...mockCurrentRows[0],
          amount: 5000000000.25,
        },
      ];
      const summary = await getFinanceSummary("org-123", 2026, 5, largeRows);
      expect(summary.balance).toBe(15000000000.75);
    });

    it("checks opening balance query triggers correct date and org scope", async () => {
      mockFrom.then = vi.fn((resolve) => resolve({ data: [], error: null }));

      await getFinanceSummary("org-123", 2026, 5, []);

      expect(mockAdmin.from).toHaveBeenCalledWith("finances");
      expect(mockFrom.select).toHaveBeenCalledWith("type, amount");
      expect(mockFrom.eq).toHaveBeenCalledWith("organization_id", "org-123");
      expect(mockFrom.lt).toHaveBeenCalledWith("date", "2026-05-01");
    });
  });

  describe("listFinances", () => {
    it("returns list of finance rows correct date scope", async () => {
      const dbRows = [
        { id: "1", amount: 100, type: "income", date: "2026-05-15" },
      ];
      mockFrom.then = vi.fn((resolve) => resolve({ data: dbRows, error: null }));

      const result = await listFinances("org-123", 2026, 5);

      expect(result).toEqual(dbRows);
      expect(mockAdmin.from).toHaveBeenCalledWith("finances");
      expect(mockFrom.select).toHaveBeenCalledWith("*");
      expect(mockFrom.eq).toHaveBeenCalledWith("organization_id", "org-123");
      expect(mockFrom.gte).toHaveBeenCalledWith("date", "2026-05-01");
      expect(mockFrom.lte).toHaveBeenCalledWith("date", "2026-05-31"); // last day of May
      expect(mockFrom.order).toHaveBeenCalledWith("date", { ascending: false });
    });

    it("handles leap year last day correctly in February", async () => {
      mockFrom.then = vi.fn((resolve) => resolve({ data: [], error: null }));

      await listFinances("org-123", 2024, 2); // Leap year 2024 Feb has 29 days

      expect(mockFrom.lte).toHaveBeenCalledWith("date", "2024-02-29");
    });

    it("handles non-leap year last day correctly in February", async () => {
      mockFrom.then = vi.fn((resolve) => resolve({ data: [], error: null }));

      await listFinances("org-123", 2023, 2); // Non-leap year 2023 Feb has 28 days

      expect(mockFrom.lte).toHaveBeenCalledWith("date", "2023-02-28");
    });

    it("returns empty array on database error", async () => {
      mockFrom.then = vi.fn((resolve) => resolve({ data: null, error: { message: "Error" } }));

      const result = await listFinances("org-123", 2026, 5);
      expect(result).toEqual([]);
    });

    it("returns empty array when database returns null data", async () => {
      mockFrom.then = vi.fn((resolve) => resolve({ data: null, error: null }));

      const result = await listFinances("org-123", 2026, 5);
      expect(result).toEqual([]);
    });
  });
});
