"use client";

import { Loader2, Power, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  removeMemberAction,
  setMemberStatusAction,
  updateMemberPositionAction,
  updateMemberRoleAction,
} from "@/features/roster/actions";
import type { RosterMember } from "@/features/roster/queries";
import type { MemberRole } from "@/types/database";

const ROLE_OPTIONS: Array<{ value: MemberRole; label: string }> = [
  { value: "member", label: "Member" },
  { value: "captain", label: "Captain" },
  { value: "coach", label: "Coach" },
  { value: "manager", label: "Manager" },
];

export function MemberManagePanel({
  member,
  orgSlug,
  canRemove,
}: {
  member: RosterMember;
  orgSlug: string;
  canRemove: boolean;
}) {
  const router = useRouter();
  const [savingRole, startSavingRole] = useTransition();
  const [savingPos, startSavingPos] = useTransition();
  const [togglingStatus, startTogglingStatus] = useTransition();
  const [removing, startRemoving] = useTransition();

  const [role, setRole] = useState<MemberRole>(member.role);
  const [position, setPosition] = useState(member.position ?? "");
  const [jersey, setJersey] = useState(
    member.jersey_number !== null && member.jersey_number !== undefined
      ? String(member.jersey_number)
      : "",
  );

  if (member.role === "owner") {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
        Owner organisasi tidak bisa dikelola dari sini. Transfer kepemilikan
        terlebih dulu lewat menu Settings.
      </div>
    );
  }

  function saveRole() {
    startSavingRole(async () => {
      const result = await updateMemberRoleAction(orgSlug, {
        member_id: member.id,
        role,
      });
      if (!result.ok) toast.error(result.message);
      else toast.success("Role diperbarui");
      router.refresh();
    });
  }

  function savePosition() {
    startSavingPos(async () => {
      const result = await updateMemberPositionAction(orgSlug, {
        member_id: member.id,
        position,
        jersey_number: jersey === "" ? null : Number(jersey),
      });
      if (!result.ok) toast.error(result.message);
      else toast.success("Posisi diperbarui");
      router.refresh();
    });
  }

  function toggleStatus() {
    startTogglingStatus(async () => {
      const result = await setMemberStatusAction(orgSlug, {
        member_id: member.id,
        is_active: !member.is_active,
      });
      if (!result.ok) toast.error(result.message);
      else
        toast.success(member.is_active ? "Member dinonaktifkan" : "Member diaktifkan");
      router.refresh();
    });
  }

  function remove() {
    if (
      !window.confirm(
        "Hapus member ini dari organisasi? Aksi ini tidak bisa dibatalkan.",
      )
    ) {
      return;
    }
    startRemoving(async () => {
      const result = await removeMemberAction(orgSlug, {
        member_id: member.id,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Member dihapus");
      router.push(`/${orgSlug}/roster`);
    });
  }

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-white">Role</h3>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`inline-flex h-9 items-center rounded-full px-3 text-xs font-medium transition ${role === r.value ? "bg-yellow-400 text-black" : "bg-zinc-800 text-white/80 hover:bg-zinc-700"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={saveRole}
          disabled={savingRole || role === member.role}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingRole ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan role
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-white">Posisi & jersey</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <label className="space-y-1 text-xs font-medium text-white/70">
            Posisi
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              maxLength={60}
              placeholder="mis. Mid-laner, Roamer"
              className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-white/70">
            Jersey #
            <input
              type="number"
              min={0}
              max={99}
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
              className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={savePosition}
          disabled={savingPos}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingPos ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan posisi
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-white">Status</h3>
        <p className="text-xs text-white/55">
          {member.is_active
            ? "Member aktif: muncul di roster dan dapat fan-out notifikasi scrim."
            : "Member nonaktif (hiatus): tetap di organisasi, tapi disembunyikan dari fan-out."}
        </p>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={togglingStatus}
          className={`inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${member.is_active ? "border border-amber-500/40 bg-amber-500/15 text-amber-100 hover:border-amber-400" : "border border-emerald-500/40 bg-emerald-500/15 text-emerald-100 hover:border-emerald-400"}`}
        >
          {togglingStatus ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Power className="h-4 w-4" />
          )}
          {member.is_active ? "Nonaktifkan (hiatus)" : "Aktifkan kembali"}
        </button>
      </section>

      {canRemove ? (
        <section className="space-y-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
          <h3 className="text-sm font-semibold text-rose-200">Hapus member</h3>
          <p className="text-xs text-rose-100/80">
            Menghapus member akan menghilangkan seat-nya di organisasi ini. Data
            yang sudah tercatat (attendance, hasil scrim, dsb) tetap utuh.
          </p>
          <button
            type="button"
            onClick={remove}
            disabled={removing}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/20 px-4 text-sm font-semibold text-rose-100 transition hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {removing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Hapus dari organisasi
          </button>
        </section>
      ) : null}
    </div>
  );
}
