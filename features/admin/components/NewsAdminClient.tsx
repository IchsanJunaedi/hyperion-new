"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Newspaper } from "lucide-react";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { NewsForm } from "./NewsForm";
import { deleteNewsPostAction, toggleNewsPostStatusAction } from "@/features/admin/actions";
import type { NewsPost } from "@/features/admin/queries";

interface Props { posts: NewsPost[]; }

const NewsAdminClient = ({ posts: initial }: Props) => {
  const [posts, setPosts] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsPost | null>(null);
  const [deleting, setDeleting] = useState<NewsPost | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [, startTransition] = useTransition();

  const handleDone = () => { setShowForm(false); setEditing(null); window.location.reload(); };

  const handleToggleStatus = (post: NewsPost) => {
    startTransition(async () => {
      const result = await toggleNewsPostStatusAction(post.id, post.status);
      if (!result.ok) { toast.error((result as { ok: false; message: string }).message); return; }
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: post.status === "published" ? "draft" : "published" } as NewsPost : p));
      toast.success(post.status === "published" ? "Dikembalikan ke draft" : "Dipublikasikan");
    });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteNewsPostAction(deleting.id);
    setDeletePending(false);
    if (!result.ok) { toast.error((result as { ok: false; message: string }).message); return; }
    toast.success("Artikel dihapus");
    setPosts((prev) => prev.filter((p) => p.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-ui-text">News</h1>
          <p className="mt-1 text-xs text-ui-text-muted">Artikel berita yang tampil di halaman publik <span className="text-ui-text-2">/news</span>.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex cursor-pointer items-center gap-2 border border-[#F5C400] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black">
          <Plus className="h-3.5 w-3.5" /> Buat Artikel
        </button>
      </div>

      {showForm && !editing && <div className="mb-6"><NewsForm onDone={handleDone} /></div>}

      {posts.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Newspaper className="h-8 w-8 text-ui-border" />
          <p className="text-sm text-ui-text-muted">Belum ada artikel. Buat artikel pertama.</p>
        </div>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id}>
            {editing?.id === post.id ? (
              <NewsForm entry={post} onDone={handleDone} />
            ) : (
              <div className="flex items-center gap-4 border border-ui-border bg-ui-bg p-4">
                {post.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.cover_image_url} alt="" className="h-12 w-20 shrink-0 object-cover" />
                ) : (
                  <div className="flex h-12 w-20 shrink-0 items-center justify-center bg-ui-surface">
                    <Newspaper className="h-5 w-5 text-ui-border" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ui-text">{post.title}</p>
                  <div className="mt-0.5 flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${post.status === "published" ? "text-green-400" : "text-ui-text-muted"}`}>
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                    {post.published_at && (
                      <span className="text-xs text-ui-text-muted">{post.published_at.slice(0, 10)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleStatus(post)}
                    className={`cursor-pointer border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${post.status === "published" ? "border-ui-border text-ui-text-muted hover:border-white/30 hover:text-white/60" : "border-green-400/50 text-green-400 hover:bg-green-400/10"}`}>
                    {post.status === "published" ? "Draft" : "Publish"}
                  </button>
                  <button onClick={() => setEditing(post)}
                    className="cursor-pointer rounded p-2 text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text-dim">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(post)}
                    className="cursor-pointer rounded p-2 text-ui-text-2 transition hover:bg-ui-hover hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={!!deleting} onCancel={() => setDeleting(null)} onConfirm={handleDelete}
        pending={deletePending} title="Hapus Artikel"
        message={`Hapus "${deleting?.title}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmPhrase="HAPUS"
      />
    </div>
  );
};
export { NewsAdminClient };
