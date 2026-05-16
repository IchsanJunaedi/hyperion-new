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
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-[#E5E2E1]">
            {report.month} {report.year}
          </h2>
          <p className="text-xs text-[#6B6A68]">Data ringkasan organisasi untuk periode ini.</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#2D2D2D] bg-[#252525] px-4 text-xs font-medium text-[#E5E2E1] transition-all hover:bg-[#2D2D2D] hover:border-[#3D3D3D] active:scale-95 disabled:opacity-50"
        >
          {downloading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Download className="h-3.5 w-3.5 text-[#D4D4D4]" />}
          {downloading ? "Membuat PDF…" : "Download PDF"}
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {/* Scrim Performance */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 transition-all hover:border-[#3D3D3D]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#252525]">
                <Trophy className="h-4 w-4 text-[#D4D4D4]" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">Scrim</span>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                report.scrims.winRate >= 50 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}>
                {report.scrims.winRate}% WR
              </span>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight text-[#E5E2E1]">{report.scrims.total}</p>
            <p className="text-xs text-[#6B6A68]">total match</p>
          </div>

          <div className="mt-6 flex items-center gap-1 h-1.5 w-full bg-[#252525] rounded-full overflow-hidden">
            <div 
              style={{ width: `${(report.scrims.wins / (report.scrims.total || 1)) * 100}%` }} 
              className="h-full bg-emerald-500/60"
            />
            <div 
              style={{ width: `${(report.scrims.draws / (report.scrims.total || 1)) * 100}%` }} 
              className="h-full bg-zinc-500/40"
            />
            <div 
              style={{ width: `${(report.scrims.losses / (report.scrims.total || 1)) * 100}%` }} 
              className="h-full bg-rose-500/60"
            />
          </div>

          <div className="mt-4 flex justify-between text-[11px] font-medium">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[#E5E2E1]">{report.scrims.wins}</span>
              <span className="text-[#6B6A68]">W</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              <span className="text-[#E5E2E1]">{report.scrims.draws}</span>
              <span className="text-[#6B6A68]">D</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span className="text-[#E5E2E1]">{report.scrims.losses}</span>
              <span className="text-[#6B6A68]">L</span>
            </div>
          </div>
        </div>

        {/* Attendance */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 transition-all hover:border-[#3D3D3D]">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#252525]">
              <FileText className="h-4 w-4 text-[#D4D4D4]" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">Kehadiran</span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight text-[#E5E2E1]">{report.attendance.avgAttendanceRate}%</p>
            <p className="text-xs text-[#6B6A68]">rata-rata</p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9B9A97]">Member Aktif</span>
              <span className="font-medium text-[#E5E2E1]">{report.attendance.totalMembers} Personil</span>
            </div>
            <div className="h-1.5 w-full bg-[#252525] rounded-full overflow-hidden">
              <div 
                style={{ width: `${report.attendance.avgAttendanceRate}%` }} 
                className="h-full bg-blue-500/60"
              />
            </div>
          </div>
        </div>

        {/* Finances */}
        <div className="group relative overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C] p-5 transition-all hover:border-[#3D3D3D]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#252525]">
                <TrendingUp className="h-4 w-4 text-[#D4D4D4]" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9A97]">Keuangan</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              report.finances.balance >= 0 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}>
              {report.finances.balance >= 0 ? "SURPLUS" : "DEFISIT"}
            </span>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-medium text-[#6B6A68]">Rp</span>
            <p className={`text-2xl font-bold tracking-tight ${report.finances.balance >= 0 ? "text-[#E5E2E1]" : "text-rose-400"}`}>
              {Math.abs(report.finances.balance).toLocaleString("id-ID")}
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#9B9A97]">Pemasukan</span>
              <span className="font-medium text-emerald-400">+{report.finances.totalIncome.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#9B9A97]">Pengeluaran</span>
              <span className="font-medium text-rose-400">-{report.finances.totalExpense.toLocaleString("id-ID")}</span>
            </div>
            <div className="pt-2 border-t border-[#2D2D2D] flex justify-between text-[10px] text-[#6B6A68]">
              <span>Nett Balance</span>
              <span className={report.finances.balance >= 0 ? "text-emerald-400/70" : "text-rose-400/70"}>
                {report.finances.balance >= 0 ? "+" : "-"}{Math.abs(report.finances.balance).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
