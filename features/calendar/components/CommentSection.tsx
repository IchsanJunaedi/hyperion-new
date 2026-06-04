"use client";

import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { CalendarEventComment } from "../types";

interface CommentSectionProps {
  comments: CalendarEventComment[];
  onAddComment: (body: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  currentUserId: string;
  readOnly?: boolean;
}

const CommentSection = ({
  comments,
  onAddComment,
  onDeleteComment,
  currentUserId,
  readOnly = false,
}: CommentSectionProps) => {
  const [commentBody, setCommentBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [commentBody]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onAddComment(commentBody.trim());
      setCommentBody("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      await onDeleteComment(commentId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return commentDate.toLocaleDateString("id-ID");
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/40 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-white/70" />
        <h3 className="text-sm font-semibold text-white/80">
          Komentar ({comments.length})
        </h3>
      </div>

      {/* Comments list */}
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">
            Belum ada komentar. Jadilah yang pertama!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="group rounded-lg border border-white/5 bg-white/2.5 p-3 transition hover:bg-white/5"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400/20 text-xs font-semibold text-yellow-300">
                    {comment.user_id.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-white/70">
                    {comment.user_id}
                  </span>
                </div>
                {comment.user_id === currentUserId && !readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingId === comment.id}
                    className="cursor-pointer opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Hapus komentar"
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-white/40 hover:text-rose-400" />
                    )}
                  </button>
                )}
              </div>
              <p className="mb-2 text-sm text-white/85">{comment.body}</p>
              <p className="text-xs text-white/40">
                {formatRelativeTime(comment.created_at)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      {!readOnly && (
        <form
          onSubmit={handleAddComment}
          className="space-y-2 border-t border-white/5 pt-4"
        >
          <textarea
            ref={textareaRef}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Tambahkan komentar..."
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-zinc-950 p-3 text-sm text-white placeholder:text-white/40 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400/20"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!commentBody.trim() || isLoading}
              className="inline-flex items-center gap-2 rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Kirim
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
export { CommentSection };
