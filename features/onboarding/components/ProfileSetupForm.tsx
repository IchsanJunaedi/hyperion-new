"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { saveProfileAction } from "@/app/onboarding/profile/actions";
import type { ProfileSetupInput } from "@/lib/validations/onboarding";

interface ProfileSetupFormProps {
  defaultValues: ProfileSetupInput;
}

export function ProfileSetupForm({ defaultValues }: ProfileSetupFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const input: ProfileSetupInput = {
            full_name: fd.get("full_name") as string,
            username: fd.get("username") as string,
            phone_wa: fd.get("phone_wa") as string,
            date_of_birth: fd.get("date_of_birth") as string,
            bio: fd.get("bio") as string,
            social_links: {
              instagram: fd.get("social_instagram") as string,
              twitter: fd.get("social_twitter") as string,
              tiktok: fd.get("social_tiktok") as string,
              youtube: fd.get("social_youtube") as string,
              discord: fd.get("social_discord") as string,
            },
            game_ids: {
              mlbb: fd.get("game_mlbb") as string,
              mlbb_server: fd.get("game_mlbb_server") as string,
              valorant: fd.get("game_valorant") as string,
              pubg: fd.get("game_pubg") as string,
              ff: fd.get("game_ff") as string,
            },
          };
          const res = await saveProfileAction(input);
          if (res.error) setError(res.error);
        });
      }}
      className="space-y-6"
    >
      {/* Required fields */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Data Wajib</h3>

        <Field label="Nama lengkap" name="full_name" required>
          <input
            name="full_name"
            required
            defaultValue={defaultValues.full_name}
            maxLength={100}
            placeholder="Nama lengkap kamu"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
          />
        </Field>

        <Field label="Nickname / ID" name="username" required>
          <input
            name="username"
            required
            defaultValue={defaultValues.username}
            maxLength={24}
            placeholder="huruf kecil, angka, underscore (3-24 karakter)"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
          />
        </Field>

        <Field label="Tanggal lahir" name="date_of_birth" required>
          <input
            type="date"
            name="date_of_birth"
            required
            defaultValue={defaultValues.date_of_birth}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
          />
        </Field>

        <Field label="Nomor WhatsApp" name="phone_wa" required>
          <input
            name="phone_wa"
            required
            defaultValue={defaultValues.phone_wa}
            maxLength={15}
            placeholder="08xxxxxxxxxx"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
          />
        </Field>
      </section>

      {/* Social links (optional) */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Sosial Media <span className="font-normal text-muted-foreground">(opsional)</span>
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Instagram" name="social_instagram">
            <input
              name="social_instagram"
              defaultValue={defaultValues.social_links?.instagram}
              placeholder="https://instagram.com/..."
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Twitter / X" name="social_twitter">
            <input
              name="social_twitter"
              defaultValue={defaultValues.social_links?.twitter}
              placeholder="https://twitter.com/..."
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="TikTok" name="social_tiktok">
            <input
              name="social_tiktok"
              defaultValue={defaultValues.social_links?.tiktok}
              placeholder="https://tiktok.com/@..."
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="YouTube" name="social_youtube">
            <input
              name="social_youtube"
              defaultValue={defaultValues.social_links?.youtube}
              placeholder="https://youtube.com/..."
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Discord" name="social_discord">
            <input
              name="social_discord"
              defaultValue={defaultValues.social_links?.discord}
              placeholder="username#1234"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
        </div>
      </section>

      {/* Game IDs (optional) */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Game ID <span className="font-normal text-muted-foreground">(opsional)</span>
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mobile Legends ID" name="game_mlbb">
            <input
              name="game_mlbb"
              defaultValue={defaultValues.game_ids?.mlbb}
              placeholder="123456789"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="ML Server" name="game_mlbb_server">
            <input
              name="game_mlbb_server"
              defaultValue={defaultValues.game_ids?.mlbb_server}
              placeholder="1234"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Valorant Riot ID" name="game_valorant">
            <input
              name="game_valorant"
              defaultValue={defaultValues.game_ids?.valorant}
              placeholder="Name#TAG"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="PUBG Mobile" name="game_pubg">
            <input
              name="game_pubg"
              defaultValue={defaultValues.game_ids?.pubg}
              placeholder="ID PUBG"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Free Fire" name="game_ff">
            <input
              name="game_ff"
              defaultValue={defaultValues.game_ids?.ff}
              placeholder="ID Free Fire"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
        </div>
      </section>

      {/* Bio */}
      <Field label="Bio (opsional)" name="bio">
        <textarea
          name="bio"
          defaultValue={defaultValues.bio ?? ""}
          rows={2}
          maxLength={280}
          placeholder="Ceritakan sedikit tentang diri kamu..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </Field>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Simpan profil
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  );
}
