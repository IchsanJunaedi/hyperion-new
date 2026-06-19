import { redirect, notFound } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Trophy,
  Calendar,
  AlertCircle,
  CalendarRange,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getOrgBySlug } from "@/features/teams/queries";
import { getCurrentUserRole } from "@/features/roster/queries";
import { getPersonalSalaryData } from "@/features/salary/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ "team-slug": string }>;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPeriodLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function formatDateFull(dateStr: string | null): string {
  if (!dateStr) return "Selamanya (Indefinite)";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const PersonalSalaryPage = async ({ params }: Props) => {
  const { "team-slug": slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/${slug}/salary`);

  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const role = await getCurrentUserRole(organization.id);
  const hasSalaryAccess = ["captain", "coach", "member"].includes(role ?? "");
  if (!hasSalaryAccess) redirect(`/${slug}`);

  const { contract, payments, bonusDistributions } = await getPersonalSalaryData(organization.id);

  // Sum total bonuses
  const totalAllBonuses = bonusDistributions.reduce((sum, b) => sum + b.bonusAmount, 0);

  // Calculate contract progression if active
  let progressPercent = 0;
  let sisaHari: number | null = null;
  if (contract && contract.status === "active" && contract.end_date) {
    const now = new Date();
    const start = new Date(contract.start_date);
    const end = new Date(contract.end_date);
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    const diffTime = end.getTime() - now.getTime();
    sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Find payment status for the current month
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const thisMonthPayment = contract
    ? payments.find((p) => p.pay_period.slice(0, 7) === currentMonthStr.slice(0, 7))
    : null;
  const isPaidThisMonth = thisMonthPayment?.status === "paid";

  // Filter current month bonuses
  const thisMonthBonuses = contract
    ? bonusDistributions.filter((b) => b.distributedAt.slice(0, 7) === currentMonthStr.slice(0, 7))
    : [];
  const thisMonthBonusTotal = thisMonthBonuses.reduce((sum, b) => sum + b.bonusAmount, 0);

  return (
    <main className="space-y-6 px-4 py-6 sm:px-8 w-full max-w-5xl mx-auto">
      {/* Page Header */}
      <header>
        <h1 className="text-2xl font-bold text-ui-text tracking-tight sm:text-3xl">Gaji & Bonus Anda</h1>
        <p className="mt-1 text-sm text-ui-text-2">
          Rincian kontrak, slip gaji bulanan, dan perolehan bonus turnamen Anda di {organization.name}.
        </p>
      </header>

      {!contract ? (
        /* Empty state - No active contract */
        <section className="flex flex-col items-center justify-center gap-4 rounded-xl border border-ui-border bg-ui-surface/20 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-ui-text-muted" />
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-ui-text">Belum ada kontrak aktif</h2>
            <p className="max-w-md text-xs text-ui-text-2">
              Kontrak Anda belum didaftarkan oleh Manager atau Owner tim di sistem. Silakan hubungi manajemen tim untuk mendaftarkan kontrak Anda.
            </p>
          </div>
        </section>
      ) : (
        /* Contract details exists */
        <div className="grid gap-6 md:grid-cols-3">
          {/* Column 1 & 2: Contract Details & Payments */}
          <div className="space-y-6 md:col-span-2">
            {/* active contract details card */}
            <section className="rounded-xl border border-ui-border bg-ui-surface/40 p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-green-400" />
                  <h2 className="text-sm font-semibold text-ui-text uppercase tracking-wider">Kontrak Aktif</h2>
                </div>
                <span className="rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-black text-green-400 uppercase tracking-widest">
                  {contract.status}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] text-ui-text-muted uppercase font-bold tracking-wider">Gaji Pokok</p>
                  <p className="text-2xl font-black text-green-400 mt-0.5">{formatRupiah(contract.monthly_salary)}</p>
                  <p className="text-[10px] text-ui-text-muted mt-0.5">dibayarkan setiap akhir bulan</p>
                </div>
                <div>
                  <p className="text-[11px] text-ui-text-muted uppercase font-bold tracking-wider">Bonus Turnamen</p>
                  <p className="text-2xl font-black text-[#F5C400] mt-0.5">
                    {contract.bonus_percentage > 0 ? `${contract.bonus_percentage}%` : "0%"}
                  </p>
                  <p className="text-[10px] text-ui-text-muted mt-0.5">bagian dari total hadiah tim</p>
                </div>
              </div>

              <hr className="border-ui-border" />

              {/* Date details and progress bar */}
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-ui-text-2 shrink-0" />
                    <div>
                      <p className="text-ui-text-muted text-[10px] uppercase font-bold tracking-wider">Mulai Kontrak</p>
                      <p className="text-ui-text-dim mt-0.5 font-medium">{formatDateFull(contract.start_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CalendarRange className="h-4 w-4 text-ui-text-2 shrink-0" />
                    <div>
                      <p className="text-ui-text-muted text-[10px] uppercase font-bold tracking-wider">Akhir Kontrak</p>
                      <p className="text-ui-text-dim mt-0.5 font-medium">
                        {contract.end_date ? formatDateFull(contract.end_date) : "Tanpa Batas Waktu"}
                      </p>
                    </div>
                  </div>
                </div>

                {contract.end_date && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ui-text-muted font-medium">Sisa Waktu Kontrak</span>
                      <span className="text-ui-text-dim font-bold">
                        {sisaHari !== null && sisaHari > 0 ? `${sisaHari} Hari lagi` : "Selesai"}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-ui-hover-strong overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500/80 to-green-400"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {contract.notes && (
                  <div className="rounded-lg bg-ui-bg border border-ui-border/50 p-3 text-xs leading-relaxed text-ui-text-2 font-light">
                    <strong className="text-[10px] uppercase text-ui-text-muted font-bold block mb-1">Catatan Kontrak:</strong>
                    {contract.notes}
                  </div>
                )}
              </div>
            </section>

            {/* Payment history list card */}
            <section className="rounded-xl border border-ui-border bg-ui-surface/40 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-ui-text-2" />
                <h2 className="text-sm font-semibold text-ui-text uppercase tracking-wider">Riwayat slip Gaji</h2>
              </div>

              {payments.length === 0 ? (
                <p className="text-xs text-ui-text-muted py-6 text-center">Belum ada riwayat gaji bulanan.</p>
              ) : (
                <div className="divide-y divide-ui-border overflow-hidden border border-ui-border rounded-lg bg-ui-bg">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3.5 text-xs hover:bg-ui-hover/30 transition">
                      <div>
                        <p className="font-semibold text-ui-text-dim">{formatPeriodLabel(p.pay_period)}</p>
                        {p.notes && <p className="text-[10px] text-ui-text-muted mt-0.5 line-clamp-1">{p.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-ui-text">{formatRupiah(Number(p.amount))}</span>
                        {p.status === "paid" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[9px] font-black text-green-400 uppercase tracking-wider">
                            <CheckCircle2 className="h-2.5 w-2.5 shrink-0" /> PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-black text-red-400 uppercase tracking-wider animate-pulse">
                            <Clock className="h-2.5 w-2.5 shrink-0" /> PENDING
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Column 3: Current Month & Tournament Bonuses */}
          <div className="space-y-6">
            {/* this month slip summary card */}
            <section className="rounded-xl border border-ui-border bg-ui-surface/40 p-5 sm:p-6 space-y-4">
              <p className="text-[10px] text-ui-text-muted uppercase tracking-wider font-bold block mb-1">
                Bulan Ini ({now.toLocaleDateString("id-ID", { month: "long" })})
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ui-text-2">Gaji Pokok:</span>
                  <span className="text-ui-text font-medium">{formatRupiah(contract.monthly_salary)}</span>
                </div>
                {thisMonthBonusTotal > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ui-text-2">Bonus Turnamen:</span>
                    <span className="text-[#F5C400] font-semibold">+{formatRupiah(thisMonthBonusTotal)}</span>
                  </div>
                )}
                <hr className="border-ui-border" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ui-text-dim font-bold">Total Pembayaran:</span>
                  <span className="text-lg font-black text-green-400">
                    {formatRupiah(contract.monthly_salary + thisMonthBonusTotal)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                {isPaidThisMonth ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 py-2.5 text-xs text-green-400 font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4" />
                    Sudah Ditransfer
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 py-2.5 text-xs text-red-400 font-bold uppercase tracking-wider">
                    <Clock className="h-4 w-4" />
                    Menunggu Pembayaran
                  </div>
                )}
              </div>
            </section>

            {/* tournament bonus distributions card */}
            <section className="rounded-xl border border-ui-border bg-ui-surface/40 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[#F5C400]" />
                  <h2 className="text-sm font-semibold text-ui-text uppercase tracking-wider">Bonus Turnamen</h2>
                </div>
                {totalAllBonuses > 0 && (
                  <span className="text-xs font-bold text-[#F5C400] bg-[#F5C400]/10 border border-[#F5C400]/20 rounded px-2 py-0.5">
                    {formatRupiah(totalAllBonuses)}
                  </span>
                )}
              </div>

              {bonusDistributions.length === 0 ? (
                <p className="text-xs text-ui-text-muted py-6 text-center">Belum ada distribusi bonus turnamen.</p>
              ) : (
                <ul className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {bonusDistributions.map((b) => (
                    <li key={b.id} className="text-xs space-y-1 hover:bg-ui-hover/10 p-1 rounded transition">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ui-text-dim truncate max-w-[140px]">
                          {b.tournamentName}
                        </span>
                        <span className="text-green-400 font-bold shrink-0 ml-2">
                          +{formatRupiah(b.bonusAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-ui-text-muted">
                        <span>
                          {b.placement ? `Juara ${b.placement} ` : ""}· Bagian {b.bonusPercentage}%
                        </span>
                        <span>
                          {new Date(b.distributedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </main>
  );
};

export default PersonalSalaryPage;
