"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { updateProfileAction } from "@/features/settings/actions/updateProfile";
import { cn } from "@/lib/utils/cn";

const GAME_OPTIONS = [
  { key: "valorant", label: "Valorant" },
  { key: "mlbb", label: "Mobile Legends" },
  { key: "pubg", label: "PUBG Mobile" },
  { key: "freefire", label: "Free Fire" },
  { key: "dota2", label: "Dota 2" },
];

const schema = z.object({
  display_name: z.string().min(1, "Wajib diisi"),
  username: z.string().optional(),
  full_name: z.string().optional(),
  bio: z.string().optional(),
  phone_wa: z.string().optional(),
  date_of_birth: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  discord: z.string().optional(),
  game_ids: z.record(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

const inputCls =
  "w-full rounded border border-[#2D2D2D] bg-[#191919] px-3 py-1.5 text-sm text-[#E5E2E1] placeholder-[#6B6A68] focus:outline-none focus:border-[#4D4D4D] transition";

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-xs text-[#9B9A97]">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function ProfileSection({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select(
        "display_name,username,full_name,bio,phone_wa,date_of_birth,avatar_url,game_ids,social_links",
      )
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }
        const social = (data.social_links as Record<string, string>) ?? {};
        const games = (data.game_ids as Record<string, string>) ?? {};
        reset({
          display_name: data.display_name ?? "",
          username: data.username ?? "",
          full_name: data.full_name ?? "",
          bio: data.bio ?? "",
          phone_wa: data.phone_wa ?? "",
          date_of_birth: data.date_of_birth ?? "",
          instagram: social.instagram ?? "",
          twitter: social.twitter ?? "",
          tiktok: social.tiktok ?? "",
          youtube: social.youtube ?? "",
          discord: social.discord ?? "",
          game_ids: games,
        });
        setAvatarUrl(data.avatar_url);
        setLoading(false);
      });
  }, [userId, reset]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error("Gagal upload foto.");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
    await updateProfileAction({ avatar_url: urlData.publicUrl });
    setUploading(false);
    toast.success("Foto profil diperbarui.");
  }

  async function onSubmit(values: FormValues) {
    const result = await updateProfileAction({
      display_name: values.display_name,
      username: values.username || undefined,
      full_name: values.full_name || undefined,
      bio: values.bio || undefined,
      phone_wa: values.phone_wa || undefined,
      date_of_birth: values.date_of_birth || null,
      game_ids: values.game_ids,
      social_links: {
        instagram: values.instagram || undefined,
        twitter: values.twitter || undefined,
        tiktok: values.tiktok || undefined,
        youtube: values.youtube || undefined,
        discord: values.discord || undefined,
      },
    });
    if (result.ok) toast.success("Profil berhasil disimpan.");
    else toast.error(result.message);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B6A68]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#353434] text-lg font-semibold text-[#D4D4D4]">
              ?
            </div>
          )}
        </div>
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
          {uploading ? "Mengupload..." : "Ganti Foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Display Name *" error={errors.display_name?.message}>
          <input {...register("display_name")} className={inputCls} />
        </Field>
        <Field label="Username">
          <input
            {...register("username")}
            className={inputCls}
            placeholder="@username"
          />
        </Field>
        <Field label="Nama Lengkap">
          <input {...register("full_name")} className={inputCls} />
        </Field>
        <Field label="Tanggal Lahir">
          <input
            type="date"
            {...register("date_of_birth")}
            className={inputCls}
          />
        </Field>
        <Field label="Nomor WhatsApp" className="col-span-2">
          <input
            {...register("phone_wa")}
            className={inputCls}
            placeholder="+628xxx"
          />
        </Field>
        <Field label="Bio" className="col-span-2">
          <textarea
            {...register("bio")}
            rows={3}
            className={cn(inputCls, "resize-none")}
          />
        </Field>
      </div>

      {/* Game IDs */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B6A68]">
          Game IDs
        </p>
        <div className="grid grid-cols-2 gap-3">
          {GAME_OPTIONS.map((g) => (
            <Field key={g.key} label={g.label}>
              <input
                {...register(`game_ids.${g.key}`)}
                className={inputCls}
                placeholder={`ID ${g.label}`}
              />
            </Field>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B6A68]">
          Social Media
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(
            ["instagram", "twitter", "tiktok", "youtube", "discord"] as const
          ).map((s) => (
            <Field
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
            >
              <input
                {...register(s)}
                className={inputCls}
                placeholder={s === "discord" ? "user#1234" : `@${s}`}
              />
            </Field>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center gap-2 rounded bg-[#2C2C2C] px-4 py-2 text-sm text-[#D4D4D4] transition hover:bg-[#353434] cursor-pointer disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan Perubahan
      </button>
    </form>
  );
}
