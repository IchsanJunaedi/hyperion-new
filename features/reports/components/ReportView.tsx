"use client";

import { Download, FileText, TrendingDown, TrendingUp, Trophy } from "lucide-react";

import type { MonthlyReport } from "@/features/reports/queries";

interface ReportViewProps {
  report: MonthlyReport;
}

export function ReportView({ report }: ReportViewProps) {
  function handleDownload() {
    // Generate a simple text-based report for download
    const content = [
      `LAPORAN BULANAN - ${report.month} ${report.year}`,
      `${"=".repeat(50)}`,
      ``,
      `SCRIM`,
      `  Total: ${report.scrims.total}`,
      `  Menang: ${report.scrims.wins}`,
      `  Kalah: ${report.scrims.losses}`,
      `  Seri: ${report.scrims.draws}`,
      `  Win Rate: ${report.scrims.winRate}%`,
      ``,
      `KEHADIRAN`,
      `  Total Member: ${report.attendance.totalMembers}`,
      `  Rata-rata Kehadiran: ${report.attendance.avgAttendanceRate}%`,
      ``,
      `KEUANGAN`,
      `  Pemasukan: Rp ${report.finances.totalIncome.toLocaleString("id-ID")}`,
      `  Pengeluaran: Rp ${report.finances.totalExpense.toLocaleString("id-ID")}`,
      `  Saldo: Rp ${report.finances.balance.toLocaleString("id-ID")}`,
      ``,
      `${"=".repeat(50)}`,
      `Generated: ${new Date().toLocaleString("id-ID")}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${report.month.toLowerCase()}-${report.year}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#E5E2E1]">
          {report.month} {report.year}
        </h2>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black hover:bg-yellow-300 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Download Laporan
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Scrim stats */}
        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-medium text-[#9B9A97]">Scrim</span>
          </div>
          <p className="text-2xl font-bold text-[#E5E2E1]">{report.scrims.total}</p>
          <p className="text-xs text-[#6B6A68] mt-1">total scrim</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-semibold text-green-400">{report.scrims.wins}</p>
              <p className="text-[10px] text-[#6B6A68]">Win</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-400">{report.scrims.losses}</p>
              <p className="text-[10px] text-[#6B6A68]">Loss</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#9B9A97]">{report.scrims.draws}</p>
              <p className="text-[10px] text-[#6B6A68]">Draw</p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs text-[#9B9A97]">Win Rate: </span>
            <span className={`text-xs font-semibold ${report.scrims.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
              {report.scrims.winRate}%
            </span>
          </div>
        </div>

        {/* Attendance */}
        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-[#9B9A97]">Kehadiran</span>
          </div>
          <p className="text-2xl font-bold text-[#E5E2E1]">{report.attendance.avgAttendanceRate}%</p>
          <p className="text-xs text-[#6B6A68] mt-1">rata-rata kehadiran</p>
          <p className="text-xs text-[#9B9A97] mt-2">
            {report.attendance.totalMembers} member aktif
          </p>
        </div>

        {/* Finances */}
        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs font-medium text-[#9B9A97]">Keuangan</span>
          </div>
          <p className={`text-2xl font-bold ${report.finances.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
            Rp {Math.abs(report.finances.balance).toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-[#6B6A68] mt-1">
            {report.finances.balance >= 0 ? "surplus" : "defisit"}
          </p>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#9B9A97]">Masuk</span>
              <span className="text-green-400">+Rp {report.finances.totalIncome.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9B9A97]">Keluar</span>
              <span className="text-red-400">-Rp {report.finances.totalExpense.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
