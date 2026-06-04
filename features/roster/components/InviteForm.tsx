"use client";

import { ChevronDown, Copy, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
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

const InviteForm = ({
  orgSlug,
  orgId,
  divisions,
  members = [],
  onClose,
}: InviteFormProps) => {
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(
    divisions[0]?.id ?? ""
  );
  const [divisionOpen, setDivisionOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<MemberRole>("member");

  const availableRoles = ROLES.filter((r) => {
    if (r.value === "manager" || r.value === "captain") {
      const divId = selectedDivisionId || null;
      const hasRole = members.some(
        (m) => m.role === r.value && m.division_id === divId
      );
      return !hasRole;
    }
    return true;
  });

  // Keep selected role valid when division changes
  useEffect(() => {
    const isAvailable = availableRoles.some((r) => r.value === selectedRole);
    if (!isAvailable && availableRoles.length > 0 && availableRoles[0]) {
      setSelectedRole(availableRoles[0].value);
    }
  }, [selectedDivisionId, availableRoles, selectedRole]);

  const divisionRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (divisionRef.current && !divisionRef.current.contains(event.target as Node)) {
        setDivisionOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
          <div ref={divisionRef} className="relative">
            <button
              type="button"
              onClick={() => setDivisionOpen(!divisionOpen)}
              className="flex h-9 w-full items-center justify-between rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white transition hover:bg-zinc-800 focus:border-yellow-400 focus:outline-none"
            >
              <span>
                {divisions.find((d) => d.id === selectedDivisionId)?.name ?? "Pilih divisi..."}
              </span>
              <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-200 ${divisionOpen ? 'rotate-180' : ''}`} />
            </button>

            {divisionOpen && (
              <div className="absolute left-0 z-50 mt-1.5 w-full rounded-md border border-white/10 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in-50 slide-in-from-top-1 duration-100">
                {divisions.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setSelectedDivisionId(d.id);
                      setDivisionOpen(false);
                    }}
                    className={`flex w-full items-center rounded px-3 py-1.5 text-left text-sm transition ${
                      selectedDivisionId === d.id
                        ? "bg-yellow-400/10 text-yellow-400 font-semibold"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            )}
            <input type="hidden" name="division_id" value={selectedDivisionId} />
          </div>
        </Field>
      )}

      <Field label="Role">
        <div ref={roleRef} className="relative">
          <button
            type="button"
            onClick={() => setRoleOpen(!roleOpen)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white transition hover:bg-zinc-800 focus:border-yellow-400 focus:outline-none"
          >
            <span>
              {ROLES.find((r) => r.value === selectedRole)?.label ?? "Pilih role..."}
            </span>
            <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-200 ${roleOpen ? 'rotate-180' : ''}`} />
          </button>

          {roleOpen && (
            <div className="absolute left-0 z-50 mt-1.5 w-full rounded-md border border-white/10 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in-50 slide-in-from-top-1 duration-100">
              {availableRoles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r.value);
                    setRoleOpen(false);
                  }}
                  className={`flex w-full items-center rounded px-3 py-1.5 text-left text-sm transition ${
                    selectedRole === r.value
                      ? "bg-yellow-400/10 text-yellow-400 font-semibold"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
          <input type="hidden" name="role" value={selectedRole} />
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
          inputMode="numeric"
          maxLength={15}
          onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ""); }}
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
};
export { InviteForm };

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
