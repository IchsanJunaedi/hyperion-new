"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const UserSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  return (
    <div className="relative w-full max-w-xs group">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className={`h-4 w-4 transition-colors ${query ? "text-ui-text" : "text-ui-text-muted group-hover:text-ui-text-2"}`} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama, username, atau email..."
        className="block h-9 w-full rounded-lg border border-ui-border bg-ui-bg pl-9 pr-8 text-xs text-ui-text placeholder-ui-text-muted transition-all focus:border-ui-text/30 focus:bg-ui-surface focus:outline-none focus:ring-1 focus:ring-ui-text/10 hover:border-[#3D3D3D]"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute inset-y-0 right-0 flex items-center pr-2 text-ui-text-muted hover:text-ui-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {isPending && (
        <div className="absolute -bottom-1 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-ui-text/20 to-transparent animate-pulse" />
      )}
    </div>
  );
};
export { UserSearch };
