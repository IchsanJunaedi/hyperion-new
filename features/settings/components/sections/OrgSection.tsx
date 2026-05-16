"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Upload } from "lucide-react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { createClient } from "@/lib/supabase/client";
import { updateProfileAction } from "@/features/settings/actions/updateProfile";
import { cn } from "@/lib/utils/cn";

const inputCls =
  "w-full rounded border border-[#2D2D2D] bg-[#191919] px-3 py-1.5 text-sm text-[#E5E2E1] placeholder-[#6B6A68] focus:outline-none focus:border-[#4D4D4D] transition disabled:opacity-50 disabled:cursor-not-allowed";

export function OrgSection({
  orgId,
  isOwner,
}: {
  orgId: string;
  isOwner: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: userData }) => {
      if (!userData.user) {
        setLoading(false);
        return;
      }
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userData.user.id)
        .maybeSingle()
        .then(({ data: profileData }) => {
          if (profileData) {
            setName(profileData.full_name ?? "");
            setLogoUrl(profileData.avatar_url);
          }
          setLoading(false);
        });
    });
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isOwner) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const ext = file.name.split(".").pop();
    const path = `${userData.user.id}/workspace-logo.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) {
      notify.error("Gagal upload logo.");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setLogoUrl(urlData.publicUrl);
    await updateProfileAction({ avatar_url: urlData.publicUrl });
    setUploading(false);
    notify.success("Logo workspace diperbarui.");
  }

  async function handleSave() {
    if (!isOwner) return;
    setSaving(true);
    const result = await updateProfileAction({ full_name: name });
    setSaving(false);
    if (result.ok) notify.success("Branding workspace berhasil disimpan.");
    else notify.error(result.message);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B6A68]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isOwner && (
        <div className="flex items-center gap-2 rounded border border-[#2D2D2D] bg-[#1E1E1E] px-4 py-3 text-sm text-[#9B9A97]">
          <Lock className="h-4 w-4 shrink-0" />
          Hanya owner yang bisa mengubah data organisasi.
        </div>
      )}

      {/* Logo */}
      <div className="flex items-center gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo"
            className="h-14 w-14 rounded object-cover"
          />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded bg-[#353434] text-lg font-semibold text-[#D4D4D4]">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        {isOwner && (
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded border border-[#2D2D2D] px-3 py-1.5 text-sm text-[#9B9A97] transition hover:bg-[#2C2C2C]",
              uploading && "cursor-not-allowed opacity-50",
            )}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Mengupload..." : "Ganti Logo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#9B9A97]">Nama Workspace / Brand</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isOwner}
          className={inputCls}
        />
      </div>

      {isOwner && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded bg-[#2C2C2C] px-4 py-2 text-sm text-[#D4D4D4] transition hover:bg-[#353434] cursor-pointer disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan Perubahan
        </button>
      )}
    </div>
  );
}
