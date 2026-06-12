"use client";

import dynamic from "next/dynamic";

import type { ActivityPoint } from "@/features/dashboard/actions/fetchAuditActivity";
import type { AuditLogItem } from "@/features/dashboard/actions/fetchAuditLogs";

const AuditActivityChart = dynamic(
  () => import("./AuditActivityChart").then((m) => m.AuditActivityChart),
  {
    ssr: false,
    loading: () => <div className="h-[200px] w-full animate-pulse rounded bg-ui-border/30" />,
  }
);
import { AuditExportButton } from "./AuditExportButton";
import { AuditFilterPanel } from "./AuditFilterPanel";
import { AuditLogList } from "./AuditLogList";
import { AuditPagination } from "./AuditPagination";

export type CurrentFilters = {
  search: string;
  module: string;
  actor: string;
  from: string;
  to: string;
  page: number;
};

interface AuditDashboardProps {
  items: AuditLogItem[];
  total: number;
  pageCount: number;
  activityData7: ActivityPoint[];
  activityData30: ActivityPoint[];
  actors: { id: string; name: string }[];
  currentFilters: CurrentFilters;
}

const AuditDashboard = ({
  items,
  total,
  pageCount,
  activityData7,
  activityData30,
  actors,
  currentFilters,
}: AuditDashboardProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ui-text">Audit Log</h1>
        <p className="mt-1 text-sm text-ui-text-2">
          Riwayat semua aktivitas penting di seluruh tim dan modul.
        </p>
      </div>

      <AuditActivityChart data7={activityData7} data30={activityData30} />

      <AuditFilterPanel
        filters={{
          search: currentFilters.search,
          module: currentFilters.module,
          actor: currentFilters.actor,
          from: currentFilters.from,
          to: currentFilters.to,
        }}
        actors={actors}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-ui-text-2">{total} aktivitas ditemukan</span>
        <AuditExportButton
          filters={{
            search: currentFilters.search,
            module: currentFilters.module,
            actor: currentFilters.actor,
            from: currentFilters.from,
            to: currentFilters.to,
          }}
        />
      </div>

      <AuditLogList logs={items} />

      <AuditPagination
        page={currentFilters.page}
        pageCount={pageCount}
        total={total}
      />
    </div>
  );
};
export { AuditDashboard };
