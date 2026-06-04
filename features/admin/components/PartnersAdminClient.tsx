"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { PartnerForm } from "./PartnerForm";
import { deletePartner } from "@/features/admin/actions";
import type { Partner } from "@/features/admin/queries";

interface Props {
  partners: Partner[];
}

const PartnersAdminClient = ({ partners: initial }: Props) => {
  const [partners, setPartners] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState<Partner | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const handleDone = () => {
    setShowForm(false);
    setEditing(null);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deletePartner(deleting.id);
    setDeletePending(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Partner dihapus");
    setPartners(prev => prev.filter(p => p.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Partners</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex cursor-pointer items-center gap-2 border border-[#F5C400] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Partner
        </button>
      </div>

      {showForm && !editing && (
        <div className="mb-6">
          <PartnerForm onDone={handleDone} />
        </div>
      )}

      <div className="space-y-2">
        {partners.map((partner) => (
          <div key={partner.id}>
            {editing?.id === partner.id ? (
              <PartnerForm partner={partner} onDone={handleDone} />
            ) : (
              <div className="flex items-center gap-4 border border-[#2D2D2D] bg-[#141414] p-4">
                {partner.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={partner.logo_url} alt={partner.name} className="h-10 w-16 shrink-0 object-contain" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#E5E2E1]">{partner.name}</p>
                  <p className="text-xs text-[#9B9A97]">{partner.is_active ? "Aktif" : "Nonaktif"} · order: {partner.sort_order}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(partner)} className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(partner)} className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
        pending={deletePending}
        title="Hapus Partner"
        message={`Hapus "${deleting?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmPhrase="HAPUS"
      />
    </div>
  );
};
export { PartnersAdminClient };
