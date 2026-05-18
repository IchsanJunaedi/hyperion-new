"use client";

import { ChevronDown, Copy, Loader2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import type { MemberRole } from "@/types/database";
import { createInviteAction } from "../actions/createInvite";

interface InviteFormProps {
  orgSlug: string;
  orgId: string;
  divisions: Array<{ id: string; name: string }>;
  members?: Array<{ role: string; division_id: string | null }>;
  onClose: () => void;
}

const ROLES: Array<{ value: MemberRole; label: string }> = [
  { value: "member", label: "Member" },
  { value: "captain", label: "Captain" },
  { value: "coach", label: "Pelatih" },
  { value: "manager", label: "Manajer" },
];

export function InviteForm({
  orgSlug,
  orgId,
  divisions,
  members = [],
  onClose,
}: InviteFormProps) {
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(
    divisions[0]?.id ?? ""
  );
  const [pending, startTransition] = useTransition();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setError(null);
      const res = await createInviteAction(orgSlug, orgId, {
        division_id: (fd.get("division_id") as string) || null,
        role: fd.get("role") as MemberRole,
        email: (fd.get("email") as string) || null,
        phone_wa: (fd.get("phone_wa") as string) || null,
      });
      if (res.ok) {
        setInviteUrl(res.inviteUrl);
      } else {
        setError(res.message);
      }
    });
  }

  if (inviteUrl) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">Link undangan siap!</p>
        <p className="text-xs text-white/60">
          Bagikan link ini kepada calon member. Link berlaku 7 hari.
        </p>
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-white/80">
            {inviteUrl}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(inviteUrl);
              notify.success("Link disalin ke clipboard");
            }}
            className="shrink-0 rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
            title="Salin link"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setInviteUrl(null);
            onClose();
          }}
          className="text-xs text-white/50 underline-offset-2 hover:text-white hover:underline"
        >
          Tutup
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Undang Member Baru</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {divisions.length > 0 && (
        <Field label="Divisi">
          <div className="relative">
            <select
              name="division_id"
              value={selectedDivisionId}
              onChange={(e) => setSelectedDivisionId(e.target.value)}
              className="h-9 w-full appearance-none rounded-md border border-white/10 bg-zinc-900 pl-3 pr-8 text-sm text-white focus:border-yellow-400 focus:outline-none"
              required
            >
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-white/50" />
          </div>
        </Field>
      )}

      <Field label="Role">
        <div className="relative">
          <select
            name="role"
            defaultValue="member"
            className="h-9 w-full appearance-none rounded-md border border-white/10 bg-zinc-900 pl-3 pr-8 text-sm text-white focus:border-yellow-400 focus:outline-none"
          >
            {ROLES.filter((r) => {
              if (r.value === "manager" || r.value === "captain") {
                const divId = selectedDivisionId || null;
                const hasRole = members.some(
                  (m) => m.role === r.value && m.division_id === divId
                );
                return !hasRole;
              }
              return true;
            }).map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-white/50" />
        </div>
      </Field>

      <Field label="Email">
        <input
          name="email"
          type="email"
          className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Nomor WA">
        <input
          name="phone_wa"
          type="tel"
          className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <p className="text-[10px] text-white/40">
        Isi salah satu dari email atau nomor WA. Link berlaku 7 hari.
      </p>

      {error && (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Buat Link Undangan
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-white/70">{label}</label>
      {children}
    </div>
  );
}
