/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPersonalSalaryData } from "../queries";
import { createClient } from "@/lib/supabase/server";

// Stub the server-only module
vi.mock("server-only", () => ({}));

describe("getPersonalSalaryData", () => {
  let mockSupabase: any;
  let mockContractsResult: any;
  let mockPaymentsResult: any;
  let mockBonusesResult: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContractsResult = {
      data: null,
      error: null,
    };
    mockPaymentsResult = {
      data: null,
      error: null,
    };
    mockBonusesResult = {
      data: null,
      error: null,
    };

    // Chainable select mocks
    const selectContractsChain = {
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => Promise.resolve(mockContractsResult)),
    };

    const selectPaymentsChain = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => Promise.resolve(mockPaymentsResult)),
    };

    const selectBonusesChain = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => Promise.resolve(mockBonusesResult)),
    };

    mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "player_contracts") {
          return {
            select: vi.fn().mockReturnValue(selectContractsChain),
          };
        }
        if (table === "salary_payments") {
          return {
            select: vi.fn().mockReturnValue(selectPaymentsChain),
          };
        }
        if (table === "tournament_bonus_distributions") {
          return {
            select: vi.fn().mockReturnValue(selectBonusesChain),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
        };
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("returns null contract and empty arrays when no contract is found", async () => {
    mockContractsResult.data = [];
    mockContractsResult.error = null;

    const res = await getPersonalSalaryData("org-123");
    expect(res.contract).toBeNull();
    expect(res.payments).toEqual([]);
    expect(res.bonusDistributions).toEqual([]);
  });

  it("returns contract, payments, and bonus distributions when found", async () => {
    const mockContract = {
      id: "contract-123",
      user_id: "user-456",
      organization_id: "org-123",
      monthly_salary: 5000000,
      bonus_percentage: 10,
      status: "active",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      notes: "Contract note",
    };

    const mockPayments = [
      {
        id: "payment-1",
        contract_id: "contract-123",
        organization_id: "org-123",
        pay_period: "2026-01-01",
        amount: 5000000,
        status: "paid",
        paid_at: "2026-01-31T00:00:00Z",
        paid_by: "manager-1",
        notes: "Paid on time",
        created_at: "2026-01-31T00:00:00Z",
      },
    ];

    const mockBonuses = [
      {
        id: "bonus-1",
        tournament_id: "tour-1",
        contract_id: "contract-123",
        tournament_name: "Championship",
        placement: 1,
        bonus_amount: 1000000,
        bonus_percentage: 10,
        distributed_at: "2026-02-15T00:00:00Z",
      },
    ];

    mockContractsResult.data = [mockContract];
    mockPaymentsResult.data = mockPayments;
    mockBonusesResult.data = mockBonuses;

    const res = await getPersonalSalaryData("org-123");
    expect(res.contract).toEqual(mockContract);
    expect(res.payments).toEqual(mockPayments);
    expect(res.bonusDistributions).toEqual([
      {
        id: "bonus-1",
        tournamentId: "tour-1",
        tournamentName: "Championship",
        placement: 1,
        bonusAmount: 1000000,
        bonusPercentage: 10,
        distributedAt: "2026-02-15T00:00:00Z",
      },
    ]);
  });

  it("handles errors gracefully", async () => {
    mockContractsResult.error = { message: "DB Error" };
    mockContractsResult.data = null;

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await getPersonalSalaryData("org-123");
    expect(res.contract).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith("getPersonalSalaryData contract:", expect.any(Object));

    consoleSpy.mockRestore();
  });
});
