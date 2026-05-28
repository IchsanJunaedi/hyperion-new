"use client";

import { Copy, Link2, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { generateInviteLinkAction } from "../actions/generateInviteLink";
import { revokeInviteAction } from "../actions/revokeInvite";
import type { MemberRole } from "@/types/database";

interface PendingInvite {
  id: string;
  role: MemberRole;
  division: string | null;
  expiresAt: string;
  createdAt: string;
}

interface InviteSectionProps {
  orgId: string;
  orgSlug: string;
  divisions: Array<{ id: string; name: string }>;
  pendingInvites: PendingInvite[];
}

const ROLES: MemberRole[] = ["member", "captain", "coach", "manager"];

const InviteSection = ({ orgId, orgSlug, divisions, pendingInvites }: InviteSectionProps) => {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState<MemberRole>("member");
  const [divisionId, setDivisionId] = useState<string>("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [revoking, startRevoke] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const res = await generateInviteLinkAction(orgId, {
        role,
        division_id: divisionId || null,
      });
      if (res.ok) {
        setGeneratedUrl(res.inviteUrl);
        setShowForm(false);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleRevoke() {
    if (!revokeTarget) return;
    startRevoke(async () => {
      const res = await revokeInviteAction(revokeTarget);
      if (res.ok) {
        success("Undangan dicabut");
        setRevokeTarget(null);
        router.refresh();
      } else {
        notifyError(res.message ?? "Gagal mencabut undangan");
        setRevokeTarget(null);
      }
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Invite Member</h2>
        <button
          type="button"
          onClick={() => { setShowForm(true); setGeneratedUrl(null); }}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-yellow-400 px-3 text-xs font-semibold text-black hover:bg-yellow-300 transition-colors"
        >
          <Link2 className="h-3.5 w-3.5" />
          Generate Link
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-white/70">Buat link undangan baru</p>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-white/50 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as MemberRole)}
                className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-2 text-sm text-white focus:outline-none"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {divisions.length > 0 && (
              <div>
                <label className="block text-xs text-white/50 mb-1">Divisi (opsional)</label>
                <select
                  value={divisionId}
                  onChange={(e) => setDivisionId(e.target.value)}
                  className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-2 text-sm text-white focus:outline-none"
                >
                  <option value="">— Tanpa divisi —</option>
                  {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={handleGenerate}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-4 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            Buat Link
          </button>
        </div>
      )}

      {generatedUrl && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 space-y-2">
          <p className="text-xs font-medium text-green-400">Link berhasil dibuat!</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-black/20 px-2 py-1 text-xs text-white/80">
              {generatedUrl}
            </code>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(generatedUrl); success("Link disalin!"); }}
              className="flex-none rounded-md border border-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/5 inline-flex items-center gap-1"
            >
              <Copy className="h-3 w-3" /> Salin
            </button>
          </div>
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div className="rounded-lg border border-white/5 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-4 py-2 text-left font-medium text-white/40">Role</th>
                <th className="px-4 py-2 text-left font-medium text-white/40">Divisi</th>
                <th className="px-4 py-2 text-left font-medium text-white/40">Berlaku sampai</th>
                <th className="px-4 py-2 text-right font-medium text-white/40">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pendingInvites.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2 text-white/70">{inv.role}</td>
                  <td className="px-4 py-2 text-white/50">{inv.division ?? "—"}</td>
                  <td className="px-4 py-2 text-white/50">
                    {new Date(inv.expiresAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setRevokeTarget(inv.id)}
                      className="rounded p-1 text-white/30 hover:bg-white/10 hover:text-red-400"
                      title="Cabut undangan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pendingInvites.length === 0 && (
        <p className="text-xs text-white/30">Tidak ada undangan aktif.</p>
      )}

      <ConfirmDeleteDialog
        open={revokeTarget !== null}
        title="Cabut Undangan"
        message="Yakin ingin mencabut link undangan ini? Link tidak bisa digunakan lagi."
        confirmText="Cabut"
        pending={revoking}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </section>
  );
};
export { InviteSection };
