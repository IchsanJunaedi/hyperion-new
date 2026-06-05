/**
 * Pure payroll aggregation helpers (no DB / server deps) so they're unit-testable.
 */

export interface MonthlySpend {
  /** ISO-ish month key, e.g. "2026-06". */
  month: string;
  /** Short human label, e.g. "Jun". */
  label: string;
  total: number;
}

export interface PaymentLite {
  pay_period: string; // date string (YYYY-MM-DD...)
  amount: number;
  status: string;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Returns "YYYY-MM" for a Date. */
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Builds the trailing-6-month spend buckets (oldest → newest) and the amount
 * paid in the current month. Only payments with status "paid" are counted.
 */
export function computePayrollSpend(
  payments: PaymentLite[],
  now: Date = new Date(),
): { paidThisMonth: number; monthlySpend: MonthlySpend[] } {
  // Seed six month buckets ending with the current month.
  const buckets: MonthlySpend[] = [];
  const keyIndex = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    keyIndex.set(key, buckets.length);
    buckets.push({ month: key, label: MONTH_LABELS[d.getMonth()]!, total: 0 });
  }

  const currentKey = monthKey(now);
  let paidThisMonth = 0;

  for (const p of payments) {
    if (p.status !== "paid") continue;
    const period = new Date(p.pay_period);
    if (Number.isNaN(period.getTime())) continue;
    const key = monthKey(period);
    const idx = keyIndex.get(key);
    if (idx !== undefined) buckets[idx]!.total += p.amount;
    if (key === currentKey) paidThisMonth += p.amount;
  }

  return { paidThisMonth, monthlySpend: buckets };
}
