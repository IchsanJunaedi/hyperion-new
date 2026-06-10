"use client";

import { CalendarDays, List, Swords } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface CalendarViewToggleProps {
  activeView: "grid" | "list" | "week";
}

const CalendarViewToggle = ({ activeView }: CalendarViewToggleProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(view: "grid" | "list" | "week") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "grid") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex items-center rounded-md border border-white/10 p-0.5">
      <button
        type="button"
        onClick={() => setView("grid")}
        title="Tampilan Grid"
        className={cn(
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition",
          activeView === "grid" ? "bg-white/10 text-ui-text" : "text-white/40 hover:text-white/70",
        )}
      >
        <CalendarDays className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setView("week")}
        title="War Room Mingguan"
        className={cn(
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition",
          activeView === "week" ? "bg-white/10 text-ui-text" : "text-white/40 hover:text-white/70",
        )}
      >
        <Swords className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setView("list")}
        title="Tampilan List"
        className={cn(
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition",
          activeView === "list" ? "bg-white/10 text-ui-text" : "text-white/40 hover:text-white/70",
        )}
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
export { CalendarViewToggle };
