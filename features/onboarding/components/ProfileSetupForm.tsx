"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { saveProfileAction } from "@/app/onboarding/profile/actions";
import type { ProfileSetupInput } from "@/lib/validations/onboarding";

interface LockedValues {
  full_name: string;
  phone_wa: string;
  email: string;
}

interface ProfileSetupFormProps {
  lockedValues: LockedValues;
  defaultValues: Omit<ProfileSetupInput, "full_name" | "phone_wa"> & {
    social_links?: { instagram?: string; tiktok?: string };
    game_ids?: { mlbb?: string; mlbb_server?: string };
  };
}

export function ProfileSetupForm({ lockedValues, defaultValues }: ProfileSetupFormProps) {
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
            full_name: lockedValues.full_name,
            username: fd.get("username") as string,
            phone_wa: lockedValues.phone_wa,
            date_of_birth: fd.get("date_of_birth") as string,
            social_links: {
              instagram: fd.get("social_instagram") as string,
              tiktok: fd.get("social_tiktok") as string,
            },
            game_ids: {
              mlbb: fd.get("game_mlbb") as string,
              mlbb_server: fd.get("game_mlbb_server") as string,
            },
          };
          const res = await saveProfileAction(input);
          if (res.error) setError(res.error);
        });
      }}
      className="space-y-6"
    >
      {/* Locked fields */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Data Akun</h3>

        <Field label="Nama Lengkap" name="full_name_display">
          <input
            readOnly
            disabled
            value={lockedValues.full_name}
            className="h-10 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
          />
        </Field>

        <Field label="Email" name="email_display">
          <input
            readOnly
            disabled
            value={lockedValues.email}
            className="h-10 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
          />
        </Field>

        <Field label="Nomor WhatsApp" name="phone_wa_display">
          <input
            readOnly
            disabled
            value={lockedValues.phone_wa}
            className="h-10 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
          />
        </Field>
      </section>

      {/* Editable required fields */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Data Wajib</h3>

        <Field label="Nickname" name="username" required>
          <input
            name="username"
            required
            defaultValue={defaultValues.username}
            maxLength={24}
            placeholder="huruf kecil, angka, underscore (3-24 karakter)"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
          />
        </Field>

        <Field label="Tanggal Lahir" name="date_of_birth" required>
          <input
            type="date"
            name="date_of_birth"
            required
            defaultValue={defaultValues.date_of_birth}
            style={{ colorScheme: "dark" }}
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
          <Field label="TikTok" name="social_tiktok">
            <input
              name="social_tiktok"
              defaultValue={defaultValues.social_links?.tiktok}
              placeholder="https://tiktok.com/@..."
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
          <Field label="Server" name="game_mlbb_server">
            <input
              name="game_mlbb_server"
              defaultValue={defaultValues.game_ids?.mlbb_server}
              placeholder="1234"
              inputMode="numeric"
              pattern="[0-9]*"
              onInput={(e) => {
                const el = e.currentTarget;
                el.value = el.value.replace(/[^0-9]/g, "");
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
        </div>
      </section>

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
