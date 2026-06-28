"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const RANGES = [
  { value: "30d", label: "30 hari" },
  { value: "3m", label: "3 bulan" },
  { value: "all", label: "Semua" },
] as const;

type RangeValue = (typeof RANGES)[number]["value"];

const DateRangeSelector = ({ activeRange }: { activeRange: RangeValue }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setRange(range: RangeValue) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex w-full rounded-lg border border-ui-border bg-ui-surface p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => setRange(r.value)}
          className={cn(
            "flex-1 text-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
            activeRange === r.value
              ? "bg-yellow-400 text-black"
              : "text-ui-text-2 hover:text-ui-text",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
};
export { DateRangeSelector };
