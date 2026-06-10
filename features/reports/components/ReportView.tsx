"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { OverviewTab } from "@/features/reports/components/tabs/OverviewTab";
import { ScrimTab } from "@/features/reports/components/tabs/ScrimTab";
import { TournamentTab } from "@/features/reports/components/tabs/TournamentTab";
import { FinanceTab } from "@/features/reports/components/tabs/FinanceTab";
import { SponsorTab } from "@/features/reports/components/tabs/SponsorTab";
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
  red:         [220,  38,  38] as [number,number,number],
  redLight:    [254, 242, 242] as [number,number,number],
  redBorder:   [254, 202, 202] as [number,number,number],
  yellow:      [234, 179,   8] as [number,number,number],
  blue:        [ 37,  99, 235] as [number,number,number],
  purple:      [124,  58, 237] as [number,number,number],
};

type Doc = InstanceType<typeof import("jspdf")["jsPDF"]>;

// ─── PDF helpers ──────────────────────────────────────────────────────────────
function pdfHelpers(doc: Doc) {
  const PW = 210;
  const PH = 297;
  const M  = 20;
  const CW = PW - M * 2;

  const fill  = (...rgb: [number,number,number]) => doc.setFillColor(...rgb);
  const text  = (...rgb: [number,number,number]) => doc.setTextColor(...rgb);
  const draw  = (...rgb: [number,number,number]) => doc.setDrawColor(...rgb);
  const font  = (s: "normal"|"bold") => doc.setFont("helvetica", s);
  const size  = (n: number) => doc.setFontSize(n);

  function header(r: MonthlyReport, pageNum: number, totalPages: number) {
    fill(...C.headerBg);
    doc.rect(0, 0, PW, 50, "F");
    fill(...C.logoBg);
    doc.roundedRect(M, 12, 13, 13, 2, 2, "F");
    size(9); font("bold"); text(...C.white);
    doc.text("H", M + 4.5, 21);
    size(6.5); font("normal"); text(155, 154, 151);
    doc.text("HYPERION TEAM", M + 17, 17);
    size(21); font("bold"); text(...C.white);
    doc.text(`${r.month} ${r.year}`, M + 17, 30);
    fill(...C.yellow);
    doc.roundedRect(PW - M - 38, 11, 38, 10, 2.5, 2.5, "F");
    size(6.5); font("bold"); text(...C.black);
    doc.text("LAPORAN BULANAN", PW - M - 19, 17.5, { align: "center" });
    const genDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    size(7); font("normal"); text(155, 154, 151);
    doc.text(genDate, PW - M - 19, 28, { align: "center" });
    // page number
    size(7); font("normal"); text(...C.gray400);
    doc.text(`${pageNum} / ${totalPages}`, PW - M, 43, { align: "right" });
  }

  function footer(r: MonthlyReport) {
    fill(...C.gray100); doc.rect(0, PH - 18, PW, 18, "F");
    draw(...C.gray200); doc.setLineWidth(0.3);
    doc.line(0, PH - 18, PW, PH - 18);
    size(7); font("normal"); text(...C.gray400);
    doc.text(`Laporan Bulanan · ${r.month} ${r.year} · Hyperion Team`, M, PH - 8);
    const genFull = new Date().toLocaleString("id-ID", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    doc.text(`Dibuat: ${genFull}`, PW - M, PH - 8, { align: "right" });
  }

  function sectionTitle(label: string, labelW: number, y: number) {
    size(7); font("bold"); text(...C.gray500);
    doc.text(label, M, y);
    draw(...C.gray200);
    doc.setLineWidth(0.3);
    doc.line(M + labelW + 3, y - 1, M + CW, y - 1);
    return y + 7;
  }

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
    size(16); font("bold"); text(...valColor);
    doc.text(value, x + 5, yPos + 17);
    size(6.5); font("normal"); text(...C.gray400);
    doc.text(sub, x + 5, yPos + 23);
  }

  function rp(n: number) { return `Rp ${Math.abs(n).toLocaleString("id-ID")}`; }

  return { PW, PH, M, CW, fill, text, draw, font, size, header, footer, sectionTitle, statCard, rp };
}

// ─── PDF pages ────────────────────────────────────────────────────────────────
function buildOverviewPage(doc: Doc, r: MonthlyReport, pageNum: number, totalPages: number) {
  const { PW, M, CW, fill, text, draw, font, size, header, footer, sectionTitle, statCard, rp } = pdfHelpers(doc);
  header(r, pageNum, totalPages);
  footer(r);

  let y = 60;
  const cardH = 28;
  const cW4   = (CW - 9) / 4;

  // Activity section
  y = sectionTitle("RINGKASAN BULAN INI", 52, y);
  statCard(M,                  y, cW4, cardH, "Win Rate",  `${r.scrims.winRate}%`,       `${r.scrims.wins}W · ${r.scrims.losses}L`, r.scrims.winRate >= 50 ? C.green : C.red);
  statCard(M + (cW4 + 3),      y, cW4, cardH, "Turnamen",  String(r.tournaments.total), `${r.tournaments.ongoing} berjalan`,       C.yellow);
  statCard(M + (cW4 + 3) * 2,  y, cW4, cardH, "Kehadiran", `${r.attendance.avgAttendanceRate}%`, "rata-rata kehadiran",           C.blue);
  if (r.finances) {
    statCard(M + (cW4 + 3) * 3, y, cW4, cardH, "Saldo Kas",
      `${r.finances.balance >= 0 ? "" : "-"}${rp(r.finances.balance)}`,
      r.finances.balance >= 0 ? "surplus" : "defisit",
      r.finances.balance >= 0 ? C.green : C.red,
    );
  } else {
    statCard(M + (cW4 + 3) * 3, y, cW4, cardH, "Member Aktif", String(r.attendance.totalMembers), "anggota terdaftar", C.black);
  }
  y += cardH + 12;

  // Scrim win rate trend
  y = sectionTitle("TREN WIN RATE SCRIM (6 BLN)", 67, y);
  const barAreaW = CW - 20;
  const barSlotW = barAreaW / r.trend.scrimWinRate.length;
  for (let i = 0; i < r.trend.scrimWinRate.length; i++) {
    const p = r.trend.scrimWinRate[i]!;
    const bx = M + 10 + i * barSlotW;
    const maxH = 28;
    const bH = Math.max((p.winRate / 100) * maxH, 1);
    const bY = y + maxH - bH;
    const col = p.winRate >= 50 ? C.green : C.red;
    fill(...col); doc.setLineWidth(0);
    doc.roundedRect(bx + 3, bY, barSlotW - 6, bH, 1, 1, "F");
    size(6); font("normal"); text(...C.gray500);
    doc.text(p.monthLabel, bx + barSlotW / 2, y + maxH + 5, { align: "center" });
    size(6.5); font("bold"); text(...col);
    doc.text(`${p.winRate}%`, bx + barSlotW / 2, bY - 1.5, { align: "center" });
  }
  y += 45;

  // Activity list
  y = sectionTitle("AKTIVITAS", 22, y);
  const activities: Array<[string, string]> = [
    ["Scrim dijadwalkan", String(r.activity.scrimsScheduled)],
    ["Turnamen aktif", String(r.activity.tournamentsActive)],
    ["Member aktif", String(r.activity.membersActive)],
  ];
  if (r.activity.sponsorsActive !== null) {
    activities.push(["Sponsor aktif", String(r.activity.sponsorsActive)]);
  }
  for (const [label, val] of activities) {
    fill(...C.gray100); draw(...C.gray200); doc.setLineWidth(0.2);
    doc.roundedRect(M, y, CW, 9, 1.5, 1.5, "FD");
    size(7.5); font("normal"); text(...C.gray500);
    doc.text(label, M + 5, y + 6);
    font("bold"); text(...C.black);
    doc.text(val, M + CW - 5, y + 6, { align: "right" });
    y += 12;
  }
}

function buildScrimPage(doc: Doc, r: MonthlyReport, pageNum: number, totalPages: number) {
  const { PW, M, CW, fill, text, draw, font, size, header, footer, sectionTitle, statCard } = pdfHelpers(doc);
  header(r, pageNum, totalPages);
  footer(r);

  let y = 60;
  const cardH = 28;
  const cW4 = (CW - 9) / 4;

  y = sectionTitle("PERFORMA SCRIM", 36, y);
  statCard(M,                   y, cW4, cardH, "Total",  String(r.scrims.total),  "scrim selesai", C.black);
  statCard(M + (cW4 + 3),       y, cW4, cardH, "Menang", String(r.scrims.wins),   "kemenangan",    C.green);
  statCard(M + (cW4 + 3) * 2,  y, cW4, cardH, "Kalah",  String(r.scrims.losses), "kekalahan",     C.red);
  statCard(M + (cW4 + 3) * 3,  y, cW4, cardH, "Seri",   String(r.scrims.draws),  "seri",          C.gray500);
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

  // Per-division table
  if (r.scrims.byDivision.length > 1) {
    y = sectionTitle("PER DIVISI", 22, y);
    for (const div of r.scrims.byDivision) {
      fill(...C.gray100); draw(...C.gray200); doc.setLineWidth(0.2);
      doc.roundedRect(M, y, CW, 9, 1.5, 1.5, "FD");
      size(7.5); font("normal"); text(...C.gray500);
      doc.text(div.divisionName, M + 5, y + 6);
      size(7.5); font("bold");
      text(...C.green);
      doc.text(`${div.wins}W`, M + CW - 30, y + 6, { align: "right" });
      text(...C.red);
      doc.text(`${div.losses}L`, M + CW - 15, y + 6, { align: "right" });
      text(div.winRate >= 50 ? C.green[0] : C.red[0], div.winRate >= 50 ? C.green[1] : C.red[1], div.winRate >= 50 ? C.green[2] : C.red[2]);
      doc.text(`${div.winRate}%`, M + CW - 5, y + 6, { align: "right" });
      y += 12;
    }
  }

  // Scrim list
  if (r.scrims.list.length > 0) {
    y = sectionTitle("DAFTAR SCRIM", 28, y);
    for (const s of r.scrims.list.slice(0, 20)) {
      const col = s.isWin === true ? C.green : s.isWin === false ? C.red : C.gray400;
      const mark = s.isWin === true ? "W" : s.isWin === false ? "L" : "D";
      fill(...C.gray100); draw(...C.gray200); doc.setLineWidth(0.2);
      doc.roundedRect(M, y, CW, 9, 1.5, 1.5, "FD");
      size(7.5); font("bold"); text(...col);
      doc.text(mark, M + 5, y + 6);
      font("normal"); text(...C.gray500);
      doc.text(`vs ${s.opponentName}`, M + 12, y + 6);
      text(...C.gray400);
      doc.text(s.format.toUpperCase(), M + CW - 5, y + 6, { align: "right" });
      y += 11;
      if (y > 260) break;
    }
  }
}

function buildTournamentPage(doc: Doc, r: MonthlyReport, pageNum: number, totalPages: number) {
  const { PW, M, CW, fill, text, draw, font, size, header, footer, sectionTitle, statCard } = pdfHelpers(doc);
  header(r, pageNum, totalPages);
  footer(r);

  let y = 60;
  const cardH = 28;
  const cW3 = (CW - 6) / 3;

  y = sectionTitle("TURNAMEN", 20, y);
  statCard(M,           y, cW3, cardH, "Total",    String(r.tournaments.total),     "turnamen",  C.black);
  statCard(M + cW3 + 3, y, cW3, cardH, "Berjalan", String(r.tournaments.ongoing),   "aktif",     C.yellow);
  statCard(M + (cW3 + 3) * 2, y, cW3, cardH, "Selesai", String(r.tournaments.completed), "selesai", C.green);
  y += cardH + 12;

  if (r.tournaments.list.length > 0) {
    y = sectionTitle("DAFTAR TURNAMEN", 38, y);
    for (const t of r.tournaments.list) {
      fill(...C.gray100); draw(...C.gray200); doc.setLineWidth(0.3);
      doc.roundedRect(M, y, CW, 12, 2, 2, "FD");
      size(8); font("bold"); text(...C.black);
      doc.text(t.name, M + 5, y + 8);
      size(7); font("normal"); text(...C.gray400);
      const dateStr = new Date(t.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" });
      doc.text(`${dateStr}${t.divisionName ? ` · ${t.divisionName}` : ""}`, M + 5, y + 13.5);

      const statusLabel: Record<string, string> = {
        upcoming: "Akan Datang", ongoing: "Berjalan", completed: "Selesai", cancelled: "Dibatalkan",
      };
      const statusCol: Record<string, [number,number,number]> = {
        upcoming: C.blue, ongoing: C.yellow, completed: C.green, cancelled: C.gray400,
      };
      const sc = statusCol[t.status] ?? C.gray400;
      size(6.5); font("bold"); text(...sc);
      doc.text(statusLabel[t.status] ?? t.status, M + CW - 5, y + 8, { align: "right" });

      y += 17;

      if (t.stages.length > 0) {
        for (const stage of t.stages) {
          const total = stage.wins + stage.losses;
          size(7); font("normal"); text(...C.gray500);
          doc.text(`  ${stage.stageName}:`, M + 5, y + 5);
          if (total > 0) {
            text(...C.green);
            doc.text(`${stage.wins}W`, M + 60, y + 5);
            text(...C.red);
            doc.text(`${stage.losses}L`, M + 75, y + 5);
          } else {
            text(...C.gray400);
            doc.text("Belum dimainkan", M + 60, y + 5);
          }
          y += 9;
        }
      }

      y += 4;
      if (y > 260) break;
    }
  }
}

function buildFinancePage(doc: Doc, r: MonthlyReport, pageNum: number, totalPages: number) {
  const { PW, M, CW, fill, text, draw, font, size, header, footer, sectionTitle, statCard, rp } = pdfHelpers(doc);
  if (!r.finances) return;
  header(r, pageNum, totalPages);
  footer(r);

  let y = 60;
  const cardH = 32;
  const cW3 = (CW - 6) / 3;

  y = sectionTitle("KEUANGAN", 23, y);
  statCard(M, y, cW3, cardH, "Pemasukan", rp(r.finances.totalIncome), `${r.finances.incomeList.length} transaksi`, C.green, C.greenLight, C.greenBorder);
  statCard(M + cW3 + 3, y, cW3, cardH, "Pengeluaran", rp(r.finances.totalExpense), `${r.finances.expenseList.length} transaksi`, C.red, C.redLight, C.redBorder);
  const isPos = r.finances.balance >= 0;
  statCard(M + (cW3 + 3) * 2, y, cW3, cardH, "Saldo",
    `${isPos ? "" : "-"}${rp(r.finances.balance)}`,
    isPos ? "surplus" : "defisit",
    isPos ? C.green : C.red,
    isPos ? C.greenLight : C.redLight,
    isPos ? C.greenBorder : C.redBorder,
  );
  y += cardH + 12;

  const colW = (CW - 8) / 2;

  if (r.finances.incomeList.length > 0) {
    y = sectionTitle("PEMASUKAN", 22, y);
    for (const f of r.finances.incomeList.slice(0, 15)) {
      fill(...C.gray100); draw(...C.gray200); doc.setLineWidth(0.2);
      doc.roundedRect(M, y, colW, 9, 1.5, 1.5, "FD");
      size(7); font("normal"); text(...C.gray500);
      const label = f.description ?? f.category;
      doc.text(label.length > 25 ? label.slice(0, 22) + "…" : label, M + 5, y + 6);
      font("bold"); text(...C.green);
      doc.text(`+${rp(f.amount)}`, M + colW - 5, y + 6, { align: "right" });
      y += 11;
      if (y > 240) break;
    }
    y += 4;
  }

  if (r.finances.expenseList.length > 0) {
    const startY = 60 + cardH + 12;
    let ey = startY;
    size(7); font("bold"); text(...C.gray500);
    doc.text("PENGELUARAN", M + colW + 8, ey);
    draw(...C.gray200); doc.setLineWidth(0.3);
    doc.line(M + colW + 8 + 30, ey - 1, M + CW, ey - 1);
    ey += 7;
    for (const f of r.finances.expenseList.slice(0, 15)) {
      fill(...C.gray100); draw(...C.gray200); doc.setLineWidth(0.2);
      doc.roundedRect(M + colW + 8, ey, colW, 9, 1.5, 1.5, "FD");
      size(7); font("normal"); text(...C.gray500);
      const label = f.description ?? f.category;
      doc.text(label.length > 25 ? label.slice(0, 22) + "…" : label, M + colW + 13, ey + 6);
      font("bold"); text(...C.red);
      doc.text(`-${rp(f.amount)}`, M + CW - 5, ey + 6, { align: "right" });
      ey += 11;
      if (ey > 240) break;
    }
  }
}

function buildSponsorPage(doc: Doc, r: MonthlyReport, pageNum: number, totalPages: number) {
  const { PW, M, CW, fill, text, draw, font, size, header, footer, sectionTitle, statCard, rp } = pdfHelpers(doc);
  if (!r.sponsors) return;
  header(r, pageNum, totalPages);
  footer(r);

  let y = 60;
  const cardH = 28;
  const cW3 = (CW - 6) / 3;

  y = sectionTitle("SPONSORSHIP", 27, y);
  statCard(M,           y, cW3, cardH, "Total",   String(r.sponsors.total),   "sponsor",  C.black);
  statCard(M + cW3 + 3, y, cW3, cardH, "Aktif",   String(r.sponsors.active),  "aktif",    C.green);
  statCard(M + (cW3 + 3) * 2, y, cW3, cardH, "Prospek", String(r.sponsors.prospect), "calon",   C.blue);
  y += cardH + 6;

  if (r.sponsors.totalActiveValue > 0) {
    fill(240, 253, 244); draw(187, 247, 208); doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, 14, 2.5, 2.5, "FD");
    size(7); font("bold"); text(...C.gray500);
    doc.text("TOTAL NILAI SPONSOR AKTIF", M + 5, y + 5.5);
    size(11); font("bold"); text(...C.green);
    doc.text(rp(r.sponsors.totalActiveValue), M + 5, y + 12);
    y += 20;
  }

  if (r.sponsors.list.length > 0) {
    y = sectionTitle("DAFTAR SPONSOR", 34, y);
    const statusLabel: Record<string, string> = {
      active: "Aktif", prospect: "Prospek", inactive: "Inaktif", ended: "Selesai",
    };
    const statusCol: Record<string, [number,number,number]> = {
      active: C.green, prospect: C.blue, inactive: C.gray400, ended: C.gray400,
    };
    for (const s of r.sponsors.list) {
      fill(...C.gray100); draw(...C.gray200); doc.setLineWidth(0.3);
      doc.roundedRect(M, y, CW, 12, 2, 2, "FD");
      size(8); font("bold"); text(...C.black);
      doc.text(s.name, M + 5, y + 8);
      const sc = statusCol[s.status] ?? C.gray400;
      size(6.5); font("bold"); text(...sc);
      doc.text(statusLabel[s.status] ?? s.status, M + CW - 5, y + 5, { align: "right" });
      if (s.dealValue !== null) {
        size(7); font("normal"); text(...C.gray400);
        doc.text(rp(s.dealValue), M + CW - 5, y + 11, { align: "right" });
      }
      y += 16;
      if (y > 260) break;
    }
  }
}

// ─── Main PDF builder ─────────────────────────────────────────────────────────
async function buildFullPdf(r: MonthlyReport) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const totalPages = r.role === "owner" ? 5 : 3;

  buildOverviewPage(doc, r, 1, totalPages);

  doc.addPage();
  buildScrimPage(doc, r, 2, totalPages);

  doc.addPage();
  buildTournamentPage(doc, r, 3, totalPages);

  if (r.role === "owner") {
    doc.addPage();
    buildFinancePage(doc, r, 4, totalPages);

    doc.addPage();
    buildSponsorPage(doc, r, 5, totalPages);
  }

  doc.save(`laporan-${r.month.toLowerCase()}-${r.year}.pdf`);
}

// ─── Tab definition ───────────────────────────────────────────────────────────
type TabKey = "overview" | "scrim" | "tournament" | "finance" | "sponsor";

interface TabDef { key: TabKey; label: string; ownerOnly?: boolean }

const TABS: TabDef[] = [
  { key: "overview",    label: "Overview" },
  { key: "scrim",       label: "Scrim" },
  { key: "tournament",  label: "Turnamen" },
  { key: "finance",     label: "Keuangan",  ownerOnly: true },
  { key: "sponsor",     label: "Sponsor",   ownerOnly: true },
];

// ─── Component ────────────────────────────────────────────────────────────────
const ReportView = ({ report }: { report: MonthlyReport }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [downloading, setDownloading] = useState(false);

  const visibleTabs = TABS.filter((t) => !t.ownerOnly || report.role === "owner");

  async function handleDownload() {
    setDownloading(true);
    try {
      await buildFullPdf(report);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center justify-between gap-2 border-b border-ui-border">
        <nav className="flex gap-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative mr-5 cursor-pointer pb-3 px-1 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-yellow-400 after:content-['']"
                  : "text-white/40 hover:text-white/70",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="mb-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/5 hover:text-ui-text disabled:opacity-50"
        >
          {downloading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Download className="h-3.5 w-3.5" />}
          {downloading ? "Membuat PDF…" : "Export PDF"}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab report={report} />}
      {activeTab === "scrim" && <ScrimTab report={report} />}
      {activeTab === "tournament" && <TournamentTab report={report} />}
      {activeTab === "finance" && report.finances && <FinanceTab finances={report.finances} />}
      {activeTab === "sponsor" && report.sponsors && <SponsorTab sponsors={report.sponsors} />}
    </div>
  );
};
export { ReportView };
