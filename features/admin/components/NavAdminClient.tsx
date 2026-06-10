"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { upsertSiteSettings } from "@/features/admin/actions";

interface NavLink { label: string; href: string; }

interface Props {
  initialLinks: NavLink[];
}

const NavAdminClient = ({ initialLinks }: Props) => {
  const [links, setLinks] = useState<NavLink[]>(initialLinks);
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass = "border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text outline-none transition focus:border-[#F5C400]/50 placeholder:text-ui-text-muted";

  const move = (i: number, dir: -1 | 1) => {
    const next = [...links];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    setLinks(next);
  };

  const remove = (i: number) => setLinks((prev) => prev.filter((_, idx) => idx !== i));

  const addLink = () => {
    if (!newLabel.trim() || !newHref.trim()) return;
    setLinks((prev) => [...prev, { label: newLabel.trim(), href: newHref.trim() }]);
    setNewLabel(""); setNewHref("");
  };

  const save = async () => {
    setSaving(true);
    const result = await upsertSiteSettings({ nav_links_json: JSON.stringify(links) });
    setSaving(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Navigasi disimpan");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black uppercase tracking-tight text-ui-text">Navigasi Header</h1>
      <p className="text-xs text-ui-text-muted">Atur urutan dan isi link navigasi di header. Perubahan langsung berlaku di semua halaman.</p>

      {/* Current links */}
      <div className="space-y-2">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-3 rounded border border-ui-border bg-ui-hover px-4 py-2.5">
            <div className="flex flex-col gap-0.5">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="cursor-pointer text-ui-text-muted transition hover:text-ui-text-dim disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === links.length - 1} className="cursor-pointer text-ui-text-muted transition hover:text-ui-text-dim disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>
            <span className="w-6 text-center text-xs text-ui-text-muted">{i + 1}</span>
            <span className="min-w-[80px] text-sm font-semibold text-ui-text-dim">{link.label}</span>
            <span className="flex-1 text-xs text-ui-text-muted">{link.href}</span>
            <button type="button" onClick={() => remove(i)} className="cursor-pointer p-1 text-ui-text-muted transition hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>

      {/* Add link */}
      <div className="rounded border border-ui-border bg-ui-bg p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ui-text-2">Tambah Link</p>
        <div className="flex gap-2">
          <input className={inputClass + " w-32"} value={newLabel} placeholder="Label" onChange={(e) => setNewLabel(e.target.value)} />
          <input className={inputClass + " flex-1"} value={newHref} placeholder="/halaman atau https://..." onChange={(e) => setNewHref(e.target.value)} />
          <button type="button" onClick={addLink} disabled={!newLabel.trim() || !newHref.trim()} className="flex cursor-pointer items-center gap-1.5 border border-ui-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-ui-text-2 transition hover:border-[#F5C400] hover:text-[#F5C400] disabled:opacity-40">
            <Plus className="h-3 w-3" />Tambah
          </button>
        </div>
      </div>

      <button type="button" onClick={save} disabled={saving} className="cursor-pointer border border-[#F5C400] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50">
        {saving ? "Menyimpan..." : "Simpan Navigasi"}
      </button>
    </div>
  );
};

export { NavAdminClient };
