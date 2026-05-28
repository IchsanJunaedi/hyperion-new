"use client";

import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  addStrategyCommentAction,
  deleteStrategyCommentAction,
} from "../actions";
import type { StrategyCommentWithProfile } from "../queries";

interface StrategyCommentsProps {
  orgSlug: string;
  noteId: string;
  currentUserId: string;
  currentUserDisplayName: string;
  comments: StrategyCommentWithProfile[];
}

const StrategyComments = ({
  orgSlug,
  noteId,
  currentUserId,
  currentUserDisplayName,
  comments: initialComments,
}: StrategyCommentsProps) => {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [addPending, startAdd] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Track IDs we inserted locally so realtime doesn't duplicate them
  const localIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`strategy-comments-${noteId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "strategy_comments",
          filter: `note_id=eq.${noteId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            note_id: string;
            user_id: string;
            content: string;
            created_at: string;
          };
          // Skip if we already added it optimistically
          if (localIds.current.has(row.id)) return;
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [
              ...prev,
              { ...row, display_name: row.user_id === currentUserId ? currentUserDisplayName : null },
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "strategy_comments",
          filter: `note_id=eq.${noteId}`,
        },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          setComments((prev) => prev.filter((c) => c.id !== id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId, currentUserId, currentUserDisplayName]);

  function handleAdd() {
    if (!text.trim()) return;
    startAdd(async () => {
      const res = await addStrategyCommentAction(orgSlug, noteId, text);
      if (res.ok) {
        localIds.current.add(res.id);
        setComments((prev) => [
          ...prev,
          {
            id: res.id,
            note_id: noteId,
            user_id: currentUserId,
            content: text.trim(),
            created_at: new Date().toISOString(),
            display_name: currentUserDisplayName,
          },
        ]);
        setText("");
      } else {
        toast.error(res.message);
      }
    });
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    const res = await deleteStrategyCommentAction(orgSlug, noteId, commentId);
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } else {
      toast.error(res.message);
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-white/40" />
        <span className="text-sm font-medium text-white/60">
          Diskusi ({comments.length})
        </span>
      </div>

      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className="group flex gap-3 rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/60">
                  {c.display_name ?? "Member"}
                  <span className="ml-2 text-[10px] text-white/30">
                    {new Date(c.created_at).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
                <p className="mt-1 text-sm text-white/85 whitespace-pre-wrap">{c.content}</p>
              </div>
              {c.user_id === currentUserId && (
                <button
                  type="button"
                  disabled={deletingId === c.id}
                  onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 shrink-0 text-white/30 hover:text-red-400 transition cursor-pointer"
                >
                  {deletingId === c.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAdd();
          }}
          placeholder="Tulis komentar... (Ctrl+Enter untuk kirim)"
          rows={2}
          className="flex-1 resize-none rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white/85 placeholder-white/30 focus:border-white/20 focus:outline-none"
        />
        <button
          type="button"
          disabled={addPending || !text.trim()}
          onClick={handleAdd}
          className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40 cursor-pointer"
        >
          {addPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Kirim"}
        </button>
      </div>
    </div>
  );
};
export { StrategyComments };
