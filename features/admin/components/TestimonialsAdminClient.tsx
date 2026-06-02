"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { TestimonialForm } from "./TestimonialForm";
import { deleteTestimonial } from "@/features/admin/actions";
import type { Testimonial } from "@/features/admin/queries";

interface Props {
  testimonials: Testimonial[];
}

const TestimonialsAdminClient = ({ testimonials: initial }: Props) => {
  const [testimonials, setTestimonials] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState<Testimonial | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const handleDone = () => {
    setShowForm(false);
    setEditing(null);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteTestimonial(deleting.id);
    setDeletePending(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Testimonial dihapus");
    setTestimonials(prev => prev.filter(t => t.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Testimonials</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex cursor-pointer items-center gap-2 border border-[#F5C400] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Testimonial
        </button>
      </div>

      {showForm && !editing && (
        <div className="mb-6">
          <TestimonialForm onDone={handleDone} />
        </div>
      )}

      <div className="space-y-2">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id}>
            {editing?.id === testimonial.id ? (
              <TestimonialForm testimonial={testimonial} onDone={handleDone} />
            ) : (
              <div className="flex items-center gap-4 border border-[#2D2D2D] bg-[#141414] p-4">
                {testimonial.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={testimonial.avatar_url} alt={testimonial.author_name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#E5E2E1]">{testimonial.author_name}</p>
                  <p className="text-xs text-[#9B9A97]">
                    {testimonial.author_role && <span>{testimonial.author_role} · </span>}
                    {testimonial.is_active ? "Aktif" : "Nonaktif"} · order: {testimonial.sort_order}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(testimonial)} className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(testimonial)} className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-red-400">
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
        title="Hapus Testimonial"
        message={`Hapus testimonial dari "${deleting?.author_name}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmPhrase="HAPUS"
      />
    </div>
  );
};
export { TestimonialsAdminClient };
