"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import {
  ArrowLeft, Pencil, Trash2, Plus, CheckCircle2, Clock,
  Loader2, XCircle, Calendar, FileText, Share2, Tag, Package,
  X as XIcon, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { cn } from "@/lib/utils/cn";
import { SponsorStatusBadge } from "./SponsorStatusBadge";
import { SponsorFormModal } from "./SponsorFormModal";
import {
  deleteSponsorAction,
  addDeliverableAction,
  updateDeliverableStatusAction,
  deleteDeliverableAction,
  addSponsorNoteAction,
  deleteSponsorNoteAction,
} from "../actions";
import type { SponsorDetail, SponsorDeliverable, SponsorNote, DeliverableStatus, DeliverableCategory } from "../queries";

const STATUS_CYCLE: Record<DeliverableStatus, DeliverableStatus> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
  cancelled: "pending",
};

const STATUS_PILL: Record<DeliverableStatus, string> = {
  pending:     "border-white/10 bg-white/5 text-white/40",
  in_progress: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  done:        "border-green-500/30 bg-green-500/10 text-green-400",
  cancelled:   "border-red-500/30 bg-red-500/10 text-red-400",
};

const STATUS_ICON: Record<DeliverableStatus, React.ReactNode> = {
  pending:     <Clock className="h-3 w-3" />,
  in_progress: <Loader2 className="h-3 w-3" />,
  done:        <CheckCircle2 className="h-3 w-3" />,
  cancelled:   <XCircle className="h-3 w-3" />,
};

const STATUS_LABEL: Record<DeliverableStatus, string> = {
  pending: "Pending", in_progress: "In Progress", done: "Done", cancelled: "Dibatalkan",
};

const CATEGORY_ICON: Record<DeliverableCategory, React.ReactNode> = {
  content:  <FileText className="h-3.5 w-3.5" />,
  post:     <Share2 className="h-3.5 w-3.5" />,
  branding: <Tag className="h-3.5 w-3.5" />,
  event:    <Calendar className="h-3.5 w-3.5" />,
  other:    <Package className="h-3.5 w-3.5" />,
};

const CATEGORY_OPTIONS: Array<{ value: DeliverableCategory; label: string }> = [
  { value: "content", label: "Konten" },
  { value: "post", label: "Post / Sosmed" },
  { value: "branding", label: "Branding" },
  { value: "event", label: "Event" },
  { value: "other", label: "Lainnya" },
];

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(value: number | null, currency: string) {
  if (value === null) return null;
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

interface SponsorDetailClientProps {
  sponsor: SponsorDetail;
  orgId: string;
  backHref: string;
  listHref: string;
}

const SponsorDetailClient = ({ sponsor: initial, orgId, backHref, listHref }: SponsorDetailClientProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sponsor] = useState(initial);
  const [deliverables, setDeliverables] = useState<SponsorDeliverable[]>(initial.deliverables);
  const [historyNotes, setHistoryNotes] = useState<SponsorNote[]>(initial.historyNotes);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [dlForm, setDlForm] = useState({ title: "", description: "", category: "content" as DeliverableCategory, due_date: "" });
  const [showDlForm, setShowDlForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!openStatusId) return;
    function handleClick(e: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setOpenStatusId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openStatusId]);

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteSponsorAction(orgId, sponsor.id);
      if (res.ok) {
        notify.success("Sponsor dihapus");
        router.push(listHref);
      } else {
        notify.error(res.message);
        setConfirmDeleteOpen(false);
      }
    });
  }

  function handleStatusChange(dl: SponsorDeliverable, next: DeliverableStatus) {
    startTransition(async () => {
      const res = await updateDeliverableStatusAction(orgId, dl.id, next);
      if (res.ok) {
        setDeliverables((prev) =>
          prev.map((d) => d.id === dl.id
            ? { ...d, status: next, completed_at: next === "done" ? new Date().toISOString() : null }
            : d
          ),
        );
      } else {
        notify.error(res.message);
      }
    });
  }

  function handleDeleteDeliverable(id: string) {
    startTransition(async () => {
      const res = await deleteDeliverableAction(orgId, id);
      if (res.ok) {
        setDeliverables((prev) => prev.filter((d) => d.id !== id));
      } else {
        notify.error(res.message);
      }
    });
  }

  function handleAddDeliverable() {
    if (!dlForm.title.trim()) { notify.error("Judul deliverable tidak boleh kosong"); return; }
    startTransition(async () => {
      const res = await addDeliverableAction(orgId, sponsor.id, dlForm);
      if (res.ok && res.deliverable) {
        setDeliverables((prev) => [...prev, res.deliverable!]);
        setDlForm({ title: "", description: "", category: "content", due_date: "" });
        setShowDlForm(false);
      } else if (!res.ok) {
        notify.error(res.message);
      }
    });
  }

  function handleAddNote() {
    if (!newNote.trim()) return;
    startTransition(async () => {
      const res = await addSponsorNoteAction(orgId, sponsor.id, newNote);
      if (res.ok && res.note) {
        setHistoryNotes((prev) => [res.note!, ...prev]);
        setNewNote("");
      } else if (!res.ok) {
        notify.error(res.message);
      }
    });
  }

  function handleDeleteNote(id: string) {
    startTransition(async () => {
      const res = await deleteSponsorNoteAction(orgId, id);
      if (res.ok) {
        setHistoryNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        notify.error(res.message);
      }
    });
  }

  const inputCls = "w-full rounded-md border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text placeholder-white/30 outline-none focus:border-white/30";
  const doneDl = deliverables.filter((d) => d.status === "done").length;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-8">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-4">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-ui-text">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditModalOpen(true)}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-ui-border px-3 text-xs text-white/60 transition hover:bg-white/5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button type="button" onClick={() => setConfirmDeleteOpen(true)} disabled={pending}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-red-500/20 px-3 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
          <ConfirmDeleteDialog
            open={confirmDeleteOpen}
            title="Hapus Sponsor"
            message={`Hapus sponsor "${sponsor.name}"? Semua deliverable dan catatan akan ikut terhapus.`}
            confirmText="Hapus"
            pending={pending}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDeleteOpen(false)}
          />
        </div>
      </div>

      {/* Sponsor header card */}
      <div className="rounded-xl border border-ui-border bg-ui-surface p-6">
        <div className="flex items-start gap-4">
          {sponsor.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sponsor.logo_url} alt={sponsor.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ui-hover text-xl font-bold text-white/60">
              {sponsor.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-ui-text">{sponsor.name}</h1>
              <SponsorStatusBadge status={sponsor.status} />
            </div>
            {formatCurrency(sponsor.deal_value, sponsor.currency) && (
              <p className="mt-1 text-base font-semibold text-yellow-400">
                {formatCurrency(sponsor.deal_value, sponsor.currency)}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/40">
              {sponsor.start_date && <span>Mulai: {formatDate(sponsor.start_date)}</span>}
              {sponsor.end_date && <span>Berakhir: {formatDate(sponsor.end_date)}</span>}
            </div>
          </div>
        </div>

        {(sponsor.contact_name || sponsor.contact_email || sponsor.contact_phone) && (
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-ui-border pt-4 text-xs">
            {sponsor.contact_name && (
              <div><p className="text-white/40">PIC</p><p className="text-white/80">{sponsor.contact_name}</p></div>
            )}
            {sponsor.contact_email && (
              <div><p className="text-white/40">Email</p><p className="text-white/80">{sponsor.contact_email}</p></div>
            )}
            {sponsor.contact_phone && (
              <div><p className="text-white/40">Telepon</p><p className="text-white/80">{sponsor.contact_phone}</p></div>
            )}
          </div>
        )}

        {sponsor.notes && (
          <div className="mt-4 border-t border-ui-border pt-4">
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/50">{sponsor.notes}</p>
          </div>
        )}
      </div>

      {/* Deliverables */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ui-text">
            Deliverables
            {deliverables.length > 0 && (
              <span className="ml-2 text-xs font-normal text-white/40">{doneDl}/{deliverables.length} selesai</span>
            )}
          </h2>
          <button type="button" onClick={() => setShowDlForm((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-ui-border px-3 py-1.5 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70">
            <Plus className="h-3 w-3" />
            Tambah
          </button>
        </div>

        {showDlForm && (
          <div className="space-y-3 rounded-xl border border-ui-border bg-ui-surface p-4">
            <div className="grid grid-cols-2 gap-2">
              <input value={dlForm.title} onChange={(e) => setDlForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Judul deliverable *" className={cn(inputCls, "col-span-2")} />
              <input value={dlForm.description} onChange={(e) => setDlForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Deskripsi (opsional)" className={inputCls} />
              <input type="date" value={dlForm.due_date} onChange={(e) => setDlForm((f) => ({ ...f, due_date: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((c) => (
                <button key={c.value} type="button" onClick={() => setDlForm((f) => ({ ...f, category: c.value }))}
                  className={cn("cursor-pointer rounded-full border px-2.5 py-1 text-xs transition",
                    dlForm.category === c.value ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-ui-border text-white/40 hover:border-white/20"
                  )}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowDlForm(false)}
                className="cursor-pointer rounded-md border border-ui-border px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/5">Batal</button>
              <button type="button" onClick={handleAddDeliverable} disabled={pending}
                className="cursor-pointer rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50">Tambahkan</button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-ui-border divide-y divide-ui-border">
          {deliverables.length === 0 ? (
            <p className="py-6 text-center text-xs text-white/30">Belum ada deliverable</p>
          ) : (
            deliverables.map((dl, i) => (
              <div
                key={dl.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]",
                  i === 0 && "rounded-t-xl",
                  i === deliverables.length - 1 && "rounded-b-xl",
                )}
              >
                {/* Left: title + meta */}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", dl.status === "done" ? "text-white/35 line-through" : "text-white/80")}>
                    {dl.title}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] text-white/30">
                      {CATEGORY_ICON[dl.category]}
                      {CATEGORY_OPTIONS.find((c) => c.value === dl.category)?.label}
                    </span>
                    {dl.due_date && <span className="text-[10px] text-white/30">Due: {formatDate(dl.due_date)}</span>}
                    {dl.description && <span className="text-[10px] text-white/40">{dl.description}</span>}
                  </div>
                </div>

                {/* Right: status pill + delete */}
                <div className="flex shrink-0 items-center gap-2">
                  {/* Custom status dropdown */}
                  <div className="relative" ref={openStatusId === dl.id ? statusMenuRef : undefined}>
                    <button
                      type="button"
                      onClick={() => setOpenStatusId((id) => id === dl.id ? null : dl.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition hover:brightness-110",
                        STATUS_PILL[dl.status as DeliverableStatus]
                      )}
                    >
                      {STATUS_ICON[dl.status as DeliverableStatus]}
                      <span>{STATUS_LABEL[dl.status as DeliverableStatus]}</span>
                      <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", openStatusId === dl.id && "rotate-180")} />
                    </button>

                    {openStatusId === dl.id && (
                      <ul className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-lg border border-ui-border bg-ui-surface py-1 shadow-xl shadow-black/40">
                        {(Object.keys(STATUS_LABEL) as DeliverableStatus[]).map((s) => (
                          <li key={s}>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => {
                                handleStatusChange(dl, s);
                                setOpenStatusId(null);
                              }}
                              className={cn(
                                "flex w-full items-center gap-2.5 px-3 py-2 text-xs transition hover:bg-white/5",
                                dl.status === s ? "text-ui-text" : "text-white/50"
                              )}
                            >
                              <span className={cn(
                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                s === "pending"     && "bg-white/30",
                                s === "in_progress" && "bg-blue-400",
                                s === "done"        && "bg-green-400",
                                s === "cancelled"   && "bg-red-400",
                              )} />
                              {STATUS_LABEL[s]}
                              {dl.status === s && (
                                <CheckCircle2 className="ml-auto h-3 w-3 text-white/30" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button type="button" onClick={() => handleDeleteDeliverable(dl.id)}
                    className="shrink-0 cursor-pointer text-white/20 transition hover:text-red-400">
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notes timeline */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ui-text">Catatan / Histori</h2>

        {/* Unified input card */}
        <div className="rounded-xl border border-ui-border bg-ui-surface focus-within:border-white/20 transition">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote();
            }}
            rows={3}
            placeholder="Tulis catatan baru..."
            className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm text-ui-text placeholder-white/30 outline-none"
          />
          <div className="flex items-center justify-end border-t border-ui-border px-3 py-2">
            <button
              type="button"
              onClick={handleAddNote}
              disabled={pending || !newNote.trim()}
              className="cursor-pointer rounded-md bg-yellow-400 px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-40"
            >
              Kirim
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {historyNotes.length === 0 ? (
            <p className="py-4 text-center text-xs text-white/30">Belum ada catatan</p>
          ) : (
            historyNotes.map((n) => (
              <div key={n.id} className="group flex gap-3 rounded-lg border border-ui-border bg-ui-surface p-3">
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-sm text-white/80">{n.content}</p>
                  <p className="mt-1 text-[10px] text-white/30">
                    {new Date(n.created_at).toLocaleString("id-ID", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <button type="button" onClick={() => handleDeleteNote(n.id)}
                  className="hidden shrink-0 cursor-pointer text-white/20 transition hover:text-red-400 group-hover:block">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <SponsorFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        orgId={orgId}
        editing={sponsor}
        onSaved={() => router.refresh()}
      />
    </div>
  );
};
export { SponsorDetailClient };
