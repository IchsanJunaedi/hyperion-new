"use client";

import { Archive, Loader2, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateOrgAction, archiveDivisionAction, deleteDivisionAction } from "../actions";

interface OrgSettingsCardProps {
  org: {
    id: string;
    name: string;
    slug: string;
    tier: string;
    logo_url: string | null;
  };
  divisions: Array<{
    id: string;
    name: string;
    slug: string;
    game: string;
    is_active: boolean;
  }>;
}

export function OrgSettingsCard({ org, divisions }: OrgSettingsCardProps) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(org.name);
  const [logoUrl, setLogoUrl] = useState(org.logo_url ?? "");

  function handleSaveOrg() {
    startTransition(async () => {
      const res = await updateOrgAction(org.id, { name, tier: "komunitas", logo_url: logoUrl || null });
      if (res.ok) {
        toast.success("Tim berhasil diupdate");
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{org.name}</h3>
        <span className="text-xs text-white/40">/{org.slug}</span>
      </div>

      {/* Org settings */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-white/60">Nama Tim</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/60">Logo URL</label>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
          />
        </div>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={handleSaveOrg}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Simpan
      </button>

      {/* Divisions */}
      <div className="border-t border-white/5 pt-4">
        <h4 className="mb-2 text-sm font-medium text-white">Divisi</h4>
        <div className="space-y-2">
          {divisions.map((div) => (
            <DivisionRow key={div.id} division={div} orgId={org.id} />
          ))}
          {divisions.length === 0 && (
            <p className="text-xs text-white/40">Belum ada divisi.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DivisionRow({
  division,
  orgId,
}: {
  division: { id: string; name: string; slug: string; game: string; is_active: boolean };
  orgId: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      const res = await archiveDivisionAction(division.id);
      if (res.ok) toast.success(`${division.name} diarsipkan`);
      else toast.error(res.message);
    });
  }

  function handleDelete() {
    if (!confirm(`Yakin hapus divisi "${division.name}"? Ini tidak bisa dibatalkan.`)) return;
    startTransition(async () => {
      const res = await deleteDivisionAction(division.id);
      if (res.ok) toast.success(`${division.name} dihapus`);
      else toast.error(res.message);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
      <div>
        <span className="text-sm text-white/80">{division.name}</span>
        <span className="ml-2 text-xs text-white/40">{division.game}</span>
        {!division.is_active && (
          <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">Arsip</span>
        )}
      </div>
      <div className="flex gap-1">
        {division.is_active && (
          <button
            type="button"
            disabled={pending}
            onClick={handleArchive}
            className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-amber-400 disabled:opacity-40"
            title="Arsipkan"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-red-400 disabled:opacity-40"
          title="Hapus"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
