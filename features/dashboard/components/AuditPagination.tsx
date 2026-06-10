"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface AuditPaginationProps {
  page: number;
  pageCount: number;
  total: number;
}

const AuditPagination = ({ page, pageCount, total }: AuditPaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-xs text-ui-text-muted">{total} aktivitas total</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="h-7 w-7 flex items-center justify-center rounded border border-ui-border bg-ui-surface text-ui-text-2 hover:text-ui-text disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs text-ui-text-2">
          {page} / {pageCount}
        </span>
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= pageCount}
          className="h-7 w-7 flex items-center justify-center rounded border border-ui-border bg-ui-surface text-ui-text-2 hover:text-ui-text disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
export { AuditPagination };
