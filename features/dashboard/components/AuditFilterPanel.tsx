"use client";

import { BookmarkPlus, Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/features/dashboard/components/CustomSelect";
import { ENTITY_TYPE_LABELS } from "@/features/dashboard/constants";

const PRESETS_KEY = "audit_filter_presets";
const MAX_PRESETS = 5;

type Filters = {
  search: string;
  module: string;
  actor: string;
  from: string;
  to: string;
};

type Preset = { name: string; filters: Filters };

interface AuditFilterPanelProps {
  filters: Filters;
  actors: { id: string; name: string }[];
}

function loadPresets(): Preset[] {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function savePresets(presets: Preset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

const AuditFilterPanel = ({ filters, actors }: AuditFilterPanelProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(filters.search);
  const [presets, setPresets] = useState<Preset[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const pushFilters = useCallback(
    (updated: Partial<Filters>) => {
      const merged = { ...filters, search, ...updated };
      const params = new URLSearchParams();
      if (merged.search) params.set("search", merged.search);
      if (merged.module) params.set("module", merged.module);
      if (merged.actor) params.set("actor", merged.actor);
      if (merged.from) params.set("from", merged.from);
      if (merged.to) params.set("to", merged.to);
      router.push(`${pathname}?${params.toString()}`);
    },
    [filters, search, router, pathname],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushFilters({ search: value });
    }, 300);
  };

  const handleSavePreset = () => {
    const name = window.prompt("Nama preset (maks 30 karakter):");
    if (!name?.trim()) return;
    const current: Filters = { ...filters, search };
    const updated = [
      { name: name.trim().slice(0, 30), filters: current },
      ...presets,
    ].slice(0, MAX_PRESETS);
    setPresets(updated);
    savePresets(updated);
  };

  const handleApplyPreset = (preset: Preset) => {
    setSearch(preset.filters.search);
    pushFilters(preset.filters);
  };

  const handleDeletePreset = (index: number) => {
    const updated = presets.filter((_, i) => i !== index);
    setPresets(updated);
    savePresets(updated);
  };

  const hasActiveFilters =
    filters.search || filters.module || filters.actor || filters.from || filters.to;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ui-text-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari aksi..."
            className="pl-8 h-8 w-52 text-sm bg-ui-surface border-ui-border text-ui-text placeholder:text-ui-text-muted focus-visible:ring-0 focus-visible:border-ui-text-2"
          />
        </div>

        <CustomSelect
          value={filters.module}
          options={[
            { value: "", label: "Semua Modul" },
            ...Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          ]}
          onChange={(val) => pushFilters({ module: val })}
        />

        <CustomSelect
          value={filters.actor}
          options={[
            { value: "", label: "Semua Aktor" },
            ...actors.map((a) => ({ value: a.id, label: a.name })),
          ]}
          onChange={(val) => pushFilters({ actor: val })}
        />

        <input
          type="date"
          value={filters.from}
          onChange={(e) => pushFilters({ from: e.target.value })}
          className="h-8 rounded-md border border-ui-border bg-ui-surface px-2 text-xs text-ui-text cursor-pointer focus:outline-none focus:border-ui-text-2"
        />
        <span className="text-xs text-ui-text-muted">s/d</span>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => pushFilters({ to: e.target.value })}
          className="h-8 rounded-md border border-ui-border bg-ui-surface px-2 text-xs text-ui-text cursor-pointer focus:outline-none focus:border-ui-text-2"
        />

        <button
          onClick={handleSavePreset}
          title="Simpan filter sebagai preset"
          className="h-8 w-8 flex items-center justify-center rounded-md border border-ui-border bg-ui-surface text-ui-text-muted hover:text-ui-text cursor-pointer transition-colors"
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
        </button>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch("");
              router.push(pathname);
            }}
            className="flex items-center gap-1 text-xs text-ui-text-muted hover:text-ui-text cursor-pointer transition-colors"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {presets.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-ui-text-muted flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            Preset:
          </span>
          {presets.map((preset, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <button
                onClick={() => handleApplyPreset(preset)}
                className="px-2 py-0.5 rounded-full border border-ui-border bg-ui-surface text-xs text-ui-text-2 hover:text-ui-text hover:border-ui-text-2 cursor-pointer transition-colors"
              >
                {preset.name}
              </button>
              <button
                onClick={() => handleDeletePreset(i)}
                className="text-ui-text-muted hover:text-red-400 cursor-pointer transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export { AuditFilterPanel };
