"use client";

import { Copy, Link as LinkIcon, Loader2, Mail, Phone } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { inviteMemberAction } from "@/features/roster/actions";

interface InviteFormProps {
  orgSlug: string;
  divisions: Array<{ id: string; name: string }>;
}

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "captain", label: "Captain" },
  { value: "coach", label: "Coach" },
  { value: "manager", label: "Manager" },
] as const;

type Channel = "email" | "wa";

export function InviteForm({ orgSlug, divisions }: InviteFormProps) {
  const [pending, startTransition] = useTransition();
  const [channel, setChannel] = useState<Channel>("wa");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            setGlobalError(null);
            setFieldErrors({});
            setCreatedLink(null);
            const payload =
              channel === "email"
                ? {
                    channel: "email" as const,
                    email: fd.get("email"),
                    role: fd.get("role"),
                    division_id: fd.get("division_id") || undefined,
                  }
                : {
                    channel: "wa" as const,
                    phone_wa: fd.get("phone_wa"),
                    role: fd.get("role"),
                    division_id: fd.get("division_id") || undefined,
                  };
            const result = await inviteMemberAction(orgSlug, payload);
            if (!result.ok) {
              setGlobalError(result.message);
              setFieldErrors(result.fieldErrors ?? {});
              return;
            }
            setCreatedLink(result.invite.accept_url);
            toast.success("Undangan dibuat");
          });
        }}
        className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/40 p-4"
      >
        <div>
          <p className="text-xs font-medium text-white/70">Kirim via</p>
          <div className="mt-2 flex gap-2">
            <ChannelButton
              active={channel === "wa"}
              onClick={() => setChannel("wa")}
              icon={<Phone className="h-3.5 w-3.5" />}
              label="WhatsApp"
            />
            <ChannelButton
              active={channel === "email"}
              onClick={() => setChannel("email")}
              icon={<Mail className="h-3.5 w-3.5" />}
              label="Email"
            />
          </div>
        </div>

        {channel === "wa" ? (
          <Field
            label="Nomor WhatsApp"
            name="phone_wa"
            errors={fieldErrors["phone_wa"]}
          >
            <input
              key="phone_wa"
              name="phone_wa"
              type="tel"
              required
              placeholder="081234567890"
              className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
            />
          </Field>
        ) : (
          <Field label="Email" name="email" errors={fieldErrors["email"]}>
            <input
              key="email"
              name="email"
              type="email"
              required
              placeholder="member@email.com"
              className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
            />
          </Field>
        )}

        <Field label="Role" name="role" errors={fieldErrors["role"]}>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((r, i) => (
              <label
                key={r.value}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-800 px-3 py-2 text-sm text-white/85 has-[input:checked]:bg-yellow-400 has-[input:checked]:text-black"
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                {r.label}
              </label>
            ))}
          </div>
        </Field>

        <Field
          label="Divisi (opsional)"
          name="division_id"
          errors={fieldErrors["division_id"]}
        >
          <select
            name="division_id"
            defaultValue=""
            className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
          >
            <option value="">Belum ditentukan</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>

        {globalError ? (
          <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {globalError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-yellow-400 px-5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Buat undangan
        </button>
      </form>

      {createdLink ? (
        <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-200">
            Undangan dibuat
          </p>
          <p className="text-xs text-emerald-100/80">
            {channel === "wa"
              ? "Pesan WhatsApp sudah masuk antrian — penerima akan menerima link berikut."
              : "Bagikan link berikut secara manual kepada penerima."}
          </p>
          <div className="flex flex-wrap items-center gap-2 break-all rounded-md bg-black/40 px-3 py-2 text-xs text-white/80">
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-white/55" />
            {createdLink}
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard
                .writeText(createdLink)
                .then(() => toast.success("Link disalin"))
                .catch(() => toast.error("Gagal menyalin"));
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-3 text-xs text-emerald-100 transition hover:border-emerald-400"
          >
            <Copy className="h-3.5 w-3.5" /> Salin link
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ChannelButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition ${active ? "border-yellow-400 bg-yellow-400 text-black" : "border-white/10 bg-zinc-900 text-white/80 hover:border-white/25"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({
  label,
  name,
  errors,
  children,
}: {
  label: string;
  name: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-white/70">
        {label}
      </label>
      {children}
      {errors && errors.length > 0 ? (
        <p className="text-xs text-rose-400">{errors[0]}</p>
      ) : null}
    </div>
  );
}
