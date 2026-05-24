"use client";

import { LayoutGrid, List } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface RosterViewToggleProps {
  activeView: "table" | "cards";
}

export function RosterViewToggle({ activeView }: RosterViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(view: "table" | "cards") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "table") {
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
        onClick={() => setView("table")}
        title="Tampilan Tabel"
        className={cn(
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition",
          activeView === "table" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70",
        )}
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setView("cards")}
        title="Tampilan Kartu"
        className={cn(
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition",
          activeView === "cards" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
