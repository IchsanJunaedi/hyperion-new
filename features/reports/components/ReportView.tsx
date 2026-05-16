"use client";

import { Download, FileText, Loader2, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { useState } from "react";

import type { MonthlyReport } from "@/features/reports/queries";

// ─── colour tokens ────────────────────────────────────────────────────────────
const C = {
  black:       [18,  18,  18]  as [number,number,number],
  white:       [255, 255, 255] as [number,number,number],
  headerBg:    [18,  18,  18]  as [number,number,number],
  logoBg:      [50,  50,  50]  as [number,number,number],
  gray100:     [249, 250, 251] as [number,number,number],
  gray200:     [229, 231, 235] as [number,number,number],
  gray400:     [156, 163, 175] as [number,number,number],
  gray500:     [107, 114, 128] as [number,number,number],
  green:       [22,  163,  74] as [number,number,number],
  greenLight:  [240, 253, 244] as [number,number,number],
  greenBorder: [187, 247, 208] as [number,number,number],
  greenMuted:  [134, 239, 172] as [number,number,number],
  red:         [220,  38,  38] as [number,number,number],
  redLight:    [254, 242, 242] as [number,number,number],
  redBorder:   [254, 202, 202] as [number,number,number],
  redMuted:    [252, 165, 165] as [number,number,number],
  yellow:      [234, 179,   8] as [number,number,number],
  blue:        [ 37,  99, 235] as [number,number,number],
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function rp(n: number) {
  return `Rp ${Math.abs(n).toLocaleString("id-ID")}`;
}

function buildPdf(doc: InstanceType<typeof import("jspdf")["jsPDF"]>, r: MonthlyReport) {
  const PW = 210;   // page width mm
  const PH = 297;   // page height mm
  const M  = 20;    // margin mm
  const CW = PW - M * 2; // content width

  const fill  = (...rgb: [number,number,number]) => doc.setFillColor(...rgb);
  const text  = (...rgb: [number,number,number]) => doc.setTextColor(...rgb);
  const draw  = (...rgb: [number,number,number]) => doc.setDrawColor(...rgb);
  const font  = (s: "normal"|"bold") => doc.setFont("helvetica", s);
  const size  = (n: number) => doc.setFontSize(n);

  // ── HEADER ────────────────────────────────────────────────────────────────
  fill(...C.headerBg);
  doc.rect(0, 0, PW, 50, "F");

  // Logo box
  fill(...C.logoBg);
  doc.roundedRect(M, 12, 13, 13, 2, 2, "F");
  size(9); font("bold"); text(...C.white);
  doc.text("H", M + 4.5, 21);

  // Org label
  size(6.5); font("normal"); text(155, 154, 151);
  doc.text("HYPERION TEAM", M + 17, 17);

  // Month + Year (big)
  size(21); font("bold"); text(...C.white);
  doc.text(`${r.month} ${r.year}`, M + 17, 30);

  // Right side: badge + date
  fill(...C.yellow);
  doc.roundedRect(PW - M - 38, 11, 38, 10, 2.5, 2.5, "F");
  size(6.5); font("bold"); text(...C.black);
  doc.text("LAPORAN BULANAN", PW - M - 19, 17.5, { align: "center" });

  const genDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
  size(7); font("normal"); text(155, 154, 151);
  doc.text(genDate, PW - M - 19, 28, { align: "center" });

  let y = 60;

  // ── SECTION HEADER helper ─────────────────────────────────────────────────
  function sectionTitle(label: string, labelW: number) {
    size(7); font("bold"); text(...C.gray500);
    doc.text(label, M, y);
    draw(...C.gray200);
    doc.setLineWidth(0.3);
    doc.line(M + labelW + 3, y - 1, M + CW, y - 1);
    y += 7;
  }

  // ── STAT CARD helper ──────────────────────────────────────────────────────
  function statCard(
    x: number, yPos: number, w: number, h: number,
    label: string, value: string, sub: string,
    valColor: [number,number,number],
    bgColor: [number,number,number] = C.gray100,
    borderColor: [number,number,number] = C.gray200,
  ) {
    fill(...bgColor); draw(...borderColor); doc.setLineWidth(0.3);
    doc.roundedRect(x, yPos, w, h, 2.5, 2.5, "FD");

    size(6.5); font("bold"); text(...C.gray500);
    doc.text(label.toUpperCase(), x + 5, yPos + 7);

    size(17); font("bold"); text(...valColor);
    doc.text(value, x + 5, yPos + 17);

    size(6.5); font("normal"); text(...C.gray400);
    doc.text(sub, x + 5, yPos + 23);
  }

  // ── SCRIM SECTION ─────────────────────────────────────────────────────────
  sectionTitle("PERFORMA SCRIM", 36);

  const cW4 = (CW - 9) / 4; // 4-card width
  const cardH = 28;

  statCard(M,                    y, cW4, cardH, "Total",  String(r.scrims.total),  "scrim selesai", C.black);
  statCard(M + (cW4 + 3),        y, cW4, cardH, "Menang", String(r.scrims.wins),   "kemenangan",    C.green);
  statCard(M + (cW4 + 3) * 2,   y, cW4, cardH, "Kalah",  String(r.scrims.losses), "kekalahan",     C.red);
  statCard(M + (cW4 + 3) * 3,   y, cW4, cardH, "Seri",   String(r.scrims.draws),  "seri",          C.gray500);

  y += cardH + 6;

  // Win rate bar
  size(7.5); font("normal"); text(...C.gray500);
  doc.text("Win Rate", M, y + 3.5);

  const barX = M + 23;
  const barW = CW - 38;
  fill(...C.gray200); doc.setLineWidth(0);
  doc.roundedRect(barX, y + 0.5, barW, 5, 2.5, 2.5, "F");

  const fillPct = Math.min(Math.max(r.scrims.winRate, 0), 100);
  const barColor = fillPct >= 50 ? C.green : C.red;
  if (fillPct > 0) {
    fill(...barColor);
    doc.roundedRect(barX, y + 0.5, (fillPct / 100) * barW, 5, 2.5, 2.5, "F");
  }

  size(9); font("bold"); text(...barColor);
  doc.text(`${r.scrims.winRate}%`, M + CW, y + 4, { align: "right" });

  y += 16;

  // ── ATTENDANCE SECTION ────────────────────────────────────────────────────
  sectionTitle("KEHADIRAN", 24);

  const cW2 = (CW - 5) / 2;
  statCard(M,        y, cW2, cardH, "Rata-rata Kehadiran", `${r.attendance.avgAttendanceRate}%`, "dari total scrim bulan ini", C.blue);
  statCard(M + cW2 + 5, y, cW2, cardH, "Member Aktif", String(r.attendance.totalMembers), "anggota terdaftar", C.black);

  y += cardH + 12;

  // ── FINANCE SECTION ───────────────────────────────────────────────────────
  sectionTitle("KEUANGAN", 23);

  const cW3 = (CW - 6) / 3;
  const finH = 32;
  const isPos = r.finances.balance >= 0;

  // Pemasukan
  statCard(M, y, cW3, finH,
    "Pemasukan", rp(r.finances.totalIncome), "total masuk",
    C.green, C.greenLight, C.greenBorder,
  );
  // Pengeluaran
  statCard(M + cW3 + 3, y, cW3, finH,
    "Pengeluaran", rp(r.finances.totalExpense), "total keluar",
    C.red, C.redLight, C.redBorder,
  );
  // Saldo
  statCard(M + (cW3 + 3) * 2, y, cW3, finH,
    "Saldo",
    `${isPos ? "" : "-"}${rp(r.finances.balance)}`,
    isPos ? "surplus" : "defisit",
    isPos ? C.green : C.red,
    isPos ? C.greenLight : C.redLight,
    isPos ? C.greenBorder : C.redBorder,
  );

  // ── FOOTER ────────────────────────────────────────────────────────────────
  fill(...C.gray100); doc.rect(0, PH - 18, PW, 18, "F");
  draw(...C.gray200); doc.setLineWidth(0.3);
  doc.line(0, PH - 18, PW, PH - 18);

  size(7); font("normal"); text(...C.gray400);
  doc.text(`Laporan Bulanan · ${r.month} ${r.year} · Hyperion Team`, M, PH - 8);

  const genFull = new Date().toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  doc.text(`Dibuat: ${genFull}`, PW - M, PH - 8, { align: "right" });
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
interface ReportViewProps {
  report: MonthlyReport;
}

export function ReportView({ report }: ReportViewProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      buildPdf(doc, report);
      doc.save(`laporan-${report.month.toLowerCase()}-${report.year}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#E5E2E1]">
          {report.month} {report.year}
        </h2>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black transition-colors hover:bg-yellow-300 disabled:opacity-60"
        >
          {downloading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Download className="h-3.5 w-3.5" />}
          {downloading ? "Membuat PDF…" : "Download PDF"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Scrim */}
        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-medium text-[#9B9A97]">Scrim</span>
          </div>
          <p className="text-2xl font-bold text-[#E5E2E1]">{report.scrims.total}</p>
          <p className="mt-1 text-xs text-[#6B6A68]">total scrim</p>
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
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-[#9B9A97]">Kehadiran</span>
          </div>
          <p className="text-2xl font-bold text-[#E5E2E1]">{report.attendance.avgAttendanceRate}%</p>
          <p className="mt-1 text-xs text-[#6B6A68]">rata-rata kehadiran</p>
          <p className="mt-2 text-xs text-[#9B9A97]">{report.attendance.totalMembers} member aktif</p>
        </div>

        {/* Finances */}
        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs font-medium text-[#9B9A97]">Keuangan</span>
          </div>
          <p className={`text-2xl font-bold ${report.finances.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
            Rp {Math.abs(report.finances.balance).toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-xs text-[#6B6A68]">
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
