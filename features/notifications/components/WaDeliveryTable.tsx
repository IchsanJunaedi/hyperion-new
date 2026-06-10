"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { useQueryClient } from "@tanstack/react-query";

import { useWaDeliveryList, type WaFilter } from "../hooks/useWaDeliveryList";
import { retryFailedWa } from "../actions";
import { WaStatusBadge } from "./WaStatusBadge";

interface WaDeliveryTableProps {
  orgId: string;
  orgSlug: string;
}

const FILTERS: { value: WaFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Terkirim" },
  { value: "failed", label: "Gagal" },
];

const PAGE_SIZE = 20;

const EMPTY_MESSAGES: Record<WaFilter, string> = {
  all: "Belum ada notifikasi WhatsApp.",
  pending: "Tidak ada notifikasi pending.",
  sent: "Tidak ada notifikasi terkirim.",
  failed: "Tidak ada pengiriman gagal.",
};

const WaDeliveryTable = ({ orgId, orgSlug }: WaDeliveryTableProps) => {
  const [filter, setFilter] = useState<WaFilter>("all");
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useWaDeliveryList(
    orgId,
    filter,
    page,
    PAGE_SIZE,
  );

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  function handleFilterChange(newFilter: WaFilter) {
    setFilter(newFilter);
    setPage(0);
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-white/5 p-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleFilterChange(f.value)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition ${
              filter === f.value
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-8 text-center text-sm text-red-400">
          Gagal memuat data pengiriman. Coba refresh halaman.
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-lg border border-[#2D2D2D] bg-[#191919] px-4 py-8 text-center text-sm text-[#6B6A68]">
          {EMPTY_MESSAGES[filter]}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[#2D2D2D]">
          <div className="min-w-[600px] overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[160px_1fr_100px_140px_80px] gap-4 px-4 py-2 border-b border-[#2D2D2D] bg-[#202020] text-xs font-medium text-[#9B9A97]">
              <span>Member</span>
              <span>Notifikasi</span>
              <span>Status</span>
              <span>Waktu</span>
              <span className="text-right">Aksi</span>
            </div>

            {/* Data rows */}
            {data.data.map((notif) => (
              <WaDeliveryRow
                key={notif.id}
                notif={notif as unknown as Parameters<typeof WaDeliveryRow>[0]["notif"]}
                orgId={orgId}
              />
            ))}
          </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#6B6A68]">
                Halaman {page + 1} dari {totalPages} ({data.total} total)
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="cursor-pointer rounded-md p-1.5 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#E5E2E1] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="cursor-pointer rounded-md p-1.5 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#E5E2E1] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export { WaDeliveryTable };

// --- Individual row with retry logic ---

interface WaDeliveryRowProps {
  notif: {
    id: string;
    title: string;
    status: string;
    wa_number: string | null;
    attempts: number;
    created_at: string;
    profiles?: { display_name: string | null } | null;
  };
  orgId: string;
}

function WaDeliveryRow({ notif, orgId }: WaDeliveryRowProps) {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const displayName =
    (notif.profiles as { display_name: string | null } | undefined)
      ?.display_name ?? notif.wa_number ?? "—";

  const status = notif.status as "pending" | "sent" | "failed";
  const retryCount = notif.attempts ?? 0;
  const maxRetriesReached = retryCount >= 3;

  function handleRetry() {
    startTransition(async () => {
      const result = await retryFailedWa(notif.id, orgId);
      if (result.ok) {
        notify.success("Notifikasi di-queue ulang untuk pengiriman");
        queryClient.invalidateQueries({ queryKey: ["wa-delivery", orgId] });
      } else {
        notify.error(result.message);
      }
    });
  }

  const timestamp = new Date(notif.created_at).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className="grid grid-cols-[160px_1fr_100px_140px_80px] gap-4 px-4 py-3 border-b border-[#2D2D2D] last:border-b-0 hover:bg-[#2C2C2C] transition text-sm text-[#E5E2E1]">
      <span className="truncate text-[#E5E2E1]">{displayName}</span>
      <span className="truncate text-[#9B9A97]">{notif.title}</span>
      <span>
        <WaStatusBadge status={status} />
      </span>
      <span className="truncate text-xs text-[#6B6A68]">{timestamp}</span>
      <span className="flex items-center justify-end">
        {status === "failed" && (
          <>
            {maxRetriesReached ? (
              <span className="text-xs text-[#6B6A68]">Maks retry</span>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={handleRetry}
                className="cursor-pointer inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#E5E2E1] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Retry pengiriman"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                Retry
              </button>
            )}
          </>
        )}
      </span>
    </div>
  );
}
