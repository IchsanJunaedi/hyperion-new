"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  tier: string | null;
  divisions: Array<{ id: string; name: string }>;
  memberCount: number;
}

interface OrgDetailModalProps {
  org: OrgDetail | null;
  onClose: () => void;
}

export function OrgDetailModal({ org, onClose }: OrgDetailModalProps) {
  useEffect(() => {
    if (!org) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [org, onClose]);

  if (!org) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{org.name}</h3>
            <p className="text-xs text-white/50">/{org.slug}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Row label="Tier" value={org.tier ?? "komunitas"} />
          <Row label="Jumlah Member Aktif" value={org.memberCount.toString()} />
          {org.divisions.length > 0 && (
            <div>
              <p className="text-xs text-white/50">Divisi</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {org.divisions.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/70"
                  >
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {org.divisions.length === 0 && (
            <Row label="Divisi" value="Belum ada divisi" />
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-0.5 text-white/80">{value}</p>
    </div>
  );
}
