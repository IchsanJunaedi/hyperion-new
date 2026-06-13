"use client";

import Link from "next/link";
import { Loader2, Pencil, Save, X, Shield, Upload } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { toggleOrgPublicAction, updateOrgAction } from "../actions";
import { useNotify } from "./NotifyModal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

interface OrgSettingsCardProps {
  org: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    banner_url?: string | null;
    is_public: boolean;
  };
  divisions: Array<{
    id: string;
    name: string;
    slug: string;
    game: string;
    is_active: boolean;
  }>;
}

const OrgSettingsCard = ({ org, divisions }: OrgSettingsCardProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toggling, startToggle] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(org.name);
  const [isPublic, setIsPublic] = useState(org.is_public);
  
  const [logoUrl, setLogoUrl] = useState<string | null>(org.logo_url);
  const [bannerUrl, setBannerUrl] = useState<string | null>(org.banner_url ?? null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const { success, error: notifyError } = useNotify();

  function handleTogglePublic() {
    const next = !isPublic;
    setIsPublic(next);
    startToggle(async () => {
      const res = await toggleOrgPublicAction(org.id, next);
      if (res.ok) {
        success(next ? "Profil publik diaktifkan" : "Profil publik dinonaktifkan");
        router.refresh();
      } else {
        setIsPublic(!next);
        notifyError(res.message);
      }
    });
  }

  function handleSave() {
    if (!editName.trim() || editName.trim() === org.name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await updateOrgAction(org.id, { name: editName.trim() });
      if (res.ok) {
        success("Nama tim diubah");
        setEditing(false);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `organizations/${org.id}/logo-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      notifyError("Gagal upload logo tim.");
      setUploadingLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const res = await updateOrgAction(org.id, { logo_url: urlData.publicUrl });
    if (res.ok) {
      setLogoUrl(urlData.publicUrl);
      success("Logo tim diperbarui.");
      router.refresh();
    } else {
      notifyError(res.message);
    }
    setUploadingLogo(false);
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `organizations/${org.id}/banner-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      notifyError("Gagal upload banner tim.");
      setUploadingBanner(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const res = await updateOrgAction(org.id, { banner_url: urlData.publicUrl });
    if (res.ok) {
      setBannerUrl(urlData.publicUrl);
      success("Banner tim diperbarui.");
      router.refresh();
    } else {
      notifyError(res.message);
    }
    setUploadingBanner(false);
  }

  return (
    <div id="setting-tim" className="border border-ui-border rounded-xl p-6 bg-ui-surface/20 space-y-2">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-4">
        {editing ? (
          <div className="flex items-center gap-2 flex-1 mr-4">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 flex-1 rounded border border-ui-border bg-ui-bg px-3 text-sm font-semibold text-ui-text focus:border-ui-text-dim focus:outline-none"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            />
            <button onClick={handleSave} disabled={pending} className="p-1.5 text-green-400 hover:bg-ui-hover rounded">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </button>
            <button onClick={() => { setEditing(false); setEditName(org.name); }} className="p-1.5 text-ui-text-2 hover:bg-ui-hover rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-ui-text">{org.name}</h3>
              <span className="text-xs text-ui-text-muted">/{org.slug}</span>
              <button onClick={() => setEditing(true)} className="p-1 text-ui-text-2 hover:text-ui-text-dim hover:bg-ui-hover rounded cursor-pointer">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <Link
              href={`/${org.slug}`}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-ui-hover hover:bg-white/15 px-3 text-xs font-semibold text-ui-text transition-colors cursor-pointer border border-ui-border"
            >
              Buka Workspace
            </Link>
          </>
        )}
      </div>

      {/* Logo Tim Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-ui-border/60">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ui-text">Logo Tim</p>
          <p className="text-xs text-ui-text-muted">Logo resmi organisasi Anda (disarankan format persegi 1:1).</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-xl border border-ui-border bg-ui-bg flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
            ) : (
              <Shield className="h-8 w-8 text-ui-text-muted" />
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-ui-hover hover:bg-ui-hover-strong px-3 py-1.5 text-xs font-semibold text-ui-text transition cursor-pointer border border-ui-border">
            {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploadingLogo ? "Mengunggah..." : "Pilih Logo"}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
          </label>
        </div>
      </div>

      {/* Banner Tim Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-ui-border/60">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ui-text">Banner Tim</p>
          <p className="text-xs text-ui-text-muted">Gambar latar belakang untuk profil publik tim Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-16 w-36 rounded-xl border border-ui-border bg-ui-bg flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/50 via-amber-50/30 to-orange-100/40 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center">
                <span className="text-[10px] text-ui-text-muted">No Banner</span>
              </div>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-ui-hover hover:bg-ui-hover-strong px-3 py-1.5 text-xs font-semibold text-ui-text transition cursor-pointer border border-ui-border">
            {uploadingBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploadingBanner ? "Mengunggah..." : "Pilih Banner"}
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={uploadingBanner} />
          </label>
        </div>
      </div>

      {/* Public Profile Toggle Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-ui-border/60">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ui-text">Profil Publik</p>
          <p className="text-xs text-ui-text-muted">
            {isPublic ? (
              <span>
                Aktif ·{" "}
                <a
                  href={`/team/${org.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline dark:text-blue-400 font-medium"
                >
                  /team/{org.slug}
                </a>
              </span>
            ) : "Nonaktif — hanya anggota tim yang bisa melihat."}
          </p>
        </div>
        <button
          onClick={handleTogglePublic}
          disabled={toggling}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${isPublic ? "bg-emerald-500" : "bg-ui-border"}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isPublic ? "translate-x-4" : "translate-x-0.5"}`}
          />
        </button>
      </div>

      {/* Divisions Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-4 border-t border-ui-border/60">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ui-text">Divisi</p>
          <p className="text-xs text-ui-text-muted">Divisi game aktif yang tergabung dalam tim ini.</p>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:max-w-xs justify-end">
          {divisions.length === 0 ? (
            <p className="text-sm text-ui-text-muted italic">Belum ada divisi</p>
          ) : (
            divisions.map((div) => (
              <span
                key={div.id}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
                  div.is_active
                    ? "bg-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-500/10"
                    : "bg-ui-hover text-ui-text-muted border-ui-border"
                )}
              >
                {div.name}
                {!div.is_active && <span className="text-[9px] uppercase tracking-wider opacity-60">(Arsip)</span>}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export { OrgSettingsCard };

