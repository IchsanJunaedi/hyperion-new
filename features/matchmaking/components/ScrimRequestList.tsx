"use client";

import { Check, Clock, X } from "lucide-react";
import { useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { respondScrimRequestAction } from "@/features/matchmaking/actions";
import type { ScrimRequestWithOrgs } from "@/features/matchmaking/queries";

interface ScrimRequestListProps {
  requests: ScrimRequestWithOrgs[];
  type: "incoming" | "outgoing";
  orgSlug: string;
}

const ScrimRequestList = ({ requests, type, orgSlug }: ScrimRequestListProps) => {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-[#6B6A68] py-4 text-center">
        {type === "incoming" ? "Belum ada request masuk." : "Belum ada request keluar."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => (
        <ScrimRequestCard key={req.id} request={req} type={type} orgSlug={orgSlug} />
      ))}
    </div>
  );
};
export { ScrimRequestList };

function ScrimRequestCard({
  request,
  type,
  orgSlug,
}: {
  request: ScrimRequestWithOrgs;
  type: "incoming" | "outgoing";
  orgSlug: string;
}) {
  const { success, error } = useNotify();
  const [pending, startTransition] = useTransition();

  const otherOrg = type === "incoming" ? request.from_org : request.to_org;
  const statusColor =
    request.status === "accepted"
      ? "text-green-400"
      : request.status === "declined"
        ? "text-red-400"
        : "text-yellow-400";

  function handleRespond(status: "accepted" | "declined") {
    startTransition(async () => {
      const res = await respondScrimRequestAction(orgSlug, {
        request_id: request.id,
        status,
      });
      if (res.ok) {
        success(status === "accepted" ? "Request diterima!" : "Request ditolak.");
      } else {
        error(res.message);
      }
    });
  }

  const time = request.preferred_time
    ? new Date(request.preferred_time).toLocaleString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      })
    : null;

  return (
    <div className="rounded-lg border border-[#2D2D2D] bg-[#202020] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {otherOrg?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={otherOrg.logo_url} alt="" className="h-5 w-5 rounded object-cover" />
            ) : (
              <div className="h-5 w-5 rounded bg-[#353434] grid place-items-center text-[10px] font-semibold text-[#E5E2E1]">
                {otherOrg?.name?.slice(0, 1).toUpperCase() ?? "?"}
              </div>
            )}
            <span className="text-sm font-medium text-[#E5E2E1] truncate">
              {otherOrg?.name ?? "Tim tidak dikenal"}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#9B9A97]">
            <span>{request.division?.name ?? "—"}</span>
            <span>·</span>
            <span>{request.format.toUpperCase()}</span>
            {time && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {time}
                </span>
              </>
            )}
          </div>
          {request.message && (
            <p className="mt-2 text-xs text-[#9B9A97]">{request.message}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {request.status === "pending" && type === "incoming" ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleRespond("accepted")}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-green-500/10 px-2.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Check className="h-3 w-3" />
                Terima
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleRespond("declined")}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-red-500/10 px-2.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 cursor-pointer"
              >
                <X className="h-3 w-3" />
                Tolak
              </button>
            </>
          ) : (
            <span className={`text-xs font-medium ${statusColor}`}>
              {request.status === "accepted" ? "Diterima" : request.status === "declined" ? "Ditolak" : "Menunggu"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
