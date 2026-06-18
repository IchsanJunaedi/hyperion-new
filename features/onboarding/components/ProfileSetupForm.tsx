"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition, useEffect, useRef } from "react";

import { saveProfileAction } from "@/app/onboarding/profile/actions";
import type { ProfileSetupInput } from "@/lib/validations/onboarding";

interface LockedValues {
  full_name?: string;
  phone_wa?: string;
  email: string;
}

interface ProfileSetupFormProps {
  lockedValues: LockedValues;
  defaultValues: Omit<ProfileSetupInput, "full_name" | "phone_wa"> & {
    full_name?: string;
    phone_wa?: string;
    social_links?: { instagram?: string; tiktok?: string };
    game_ids?: { mlbb?: string; mlbb_server?: string };
  };
}

const ProfileSetupForm = ({ lockedValues, defaultValues }: ProfileSetupFormProps) => {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(lockedValues.full_name || defaultValues.full_name || "");
  const [phoneWa, setPhoneWa] = useState(lockedValues.phone_wa || defaultValues.phone_wa || "");

  const [mlbbId, setMlbbId] = useState(defaultValues.game_ids?.mlbb ?? "");
  const [mlbbServer, setMlbbServer] = useState(defaultValues.game_ids?.mlbb_server ?? "");
  const [mlbbNickname, setMlbbNickname] = useState<string | null>(null);
  const [mlbbChecking, setMlbbChecking] = useState(false);
  const [mlbbError, setMlbbError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [usernameInput, setUsernameInput] = useState(defaultValues.username || "");
  const [userTouched, setUserTouched] = useState(false);

  const [computedUsername, setComputedUsername] = useState(defaultValues.username || "");

  useEffect(() => {
    if (!userTouched && computedUsername) {
      setUsernameInput(computedUsername);
    }
  }, [computedUsername, userTouched]);

  const sanitizeUsername = (val: string) => {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24);
  };

  useEffect(() => {
    const base = mlbbNickname || fullName || lockedValues.email.split("@")[0] || "user";
    setComputedUsername(sanitizeUsername(base));
  }, [mlbbNickname, fullName, lockedValues.email]);

  useEffect(() => {
    setMlbbNickname(null);
    setMlbbError(null);
    if (!mlbbId.trim() || !mlbbServer.trim()) return;

    let mounted = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!mounted) return;
      setMlbbChecking(true);
      try {
        const res = await fetch(
          `/api/mlbb/nickname?userId=${encodeURIComponent(mlbbId.trim())}&zoneId=${encodeURIComponent(mlbbServer.trim())}`,
        );
        const json = await res.json() as { nickname: string | null };
        if (!mounted) return;
        if (json.nickname) {
          setMlbbNickname(json.nickname);
        } else {
          setMlbbError("ID atau Server tidak ditemukan");
        }
      } catch {
        if (!mounted) return;
        setMlbbError("Gagal cek nickname, coba lagi");
      } finally {
        if (mounted) setMlbbChecking(false);
      }
    }, 700);

    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mlbbId, mlbbServer]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const input: ProfileSetupInput = {
            full_name: fullName,
            username: usernameInput,
            phone_wa: phoneWa,
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

        <Field label="Nama Lengkap" name="full_name" required={!lockedValues.full_name}>
          <input
            name="full_name"
            readOnly={!!lockedValues.full_name}
            disabled={!!lockedValues.full_name}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={`h-10 w-full rounded-md border border-input px-3 text-sm focus:border-primary focus:outline-none ${
              lockedValues.full_name
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-background text-foreground"
            }`}
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

        <Field label="Nomor WhatsApp" name="phone_wa" required={!lockedValues.phone_wa}>
          <input
            name="phone_wa"
            readOnly={!!lockedValues.phone_wa}
            disabled={!!lockedValues.phone_wa}
            value={phoneWa}
            onChange={(e) => setPhoneWa(e.target.value)}
            className={`h-10 w-full rounded-md border border-input px-3 text-sm focus:border-primary focus:outline-none ${
              lockedValues.phone_wa
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-background text-foreground"
            }`}
          />
        </Field>
      </section>

      {/* Editable required fields */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Data Wajib</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mobile Legends ID" name="game_mlbb">
            <input
              name="game_mlbb"
              value={mlbbId}
              inputMode="numeric"
              onChange={(e) => setMlbbId(e.target.value.replace(/\D/g, ""))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Server" name="game_mlbb_server">
            <input
              name="game_mlbb_server"
              value={mlbbServer}
              onChange={(e) => setMlbbServer(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              pattern="[0-9]*"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
        </div>

        <Field label="Mobile Legends" name="mlbb_nickname_display">
          <input
            readOnly
            disabled
            value={mlbbNickname ?? ""}
            placeholder="Otomatis terisi setelah ID & Server diisi"
            className="h-9 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
          />
        </Field>
        {mlbbChecking && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Mengecek nickname...
          </p>
        )}
        {mlbbNickname && !mlbbChecking && (
          <p className="text-xs text-green-500">✓ Nickname ditemukan</p>
        )}
        {mlbbError && !mlbbChecking && (
          <p className="text-xs text-destructive">{mlbbError}</p>
        )}

        <Field label="Nickname" name="username" required>
          <input
            name="username"
            required
            value={usernameInput}
            onChange={(e) => {
              if (!userTouched) setUserTouched(true);
              setUsernameInput(sanitizeUsername(e.target.value));
            }}
            maxLength={24}
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
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="TikTok" name="social_tiktok">
            <input
              name="social_tiktok"
              defaultValue={defaultValues.social_links?.tiktok}
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
};
export { ProfileSetupForm };

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
