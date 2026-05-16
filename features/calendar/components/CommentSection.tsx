"use client";

import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { formatRelative } from "@/lib/utils/format";
import type { CalendarEventComment } from "@/features/calendar/types";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface CommentSectionProps {
  comments: (CalendarEventComment & { commenter?: Profile })[];
  onAddComment: (body: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  currentUserId: string;
  readOnly?: boolean;
}

export function CommentSection({
  comments,
  onAddComment,
  onDeleteComment,
  currentUserId,
  readOnly = false,
}: CommentSectionProps) {
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

  const canDeleteComment = (comment: CalendarEventComment) => {
    return comment.created_by === currentUserId;
  };

  return (
    <div className="bg-[#202020] rounded-lg border border-[#2D2D2D] p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#2D2D2D]">
        <MessageSquare className="w-5 h-5 text-[#9B9A97]" />
        <h3 className="text-base font-semibold text-[#E5E2E1]">
          Komentar ({comments.length})
        </h3>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 [scrollbar-width:thin] [scrollbar-color:#2D2D2D_#191919]">
        {comments.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[#6B6A68]">
            <p className="text-sm">Belum ada komentar</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="group bg-[#191919] rounded-lg border border-[#2D2D2D] p-4 hover:border-[#3D3D3D] transition-colors"
            >
              {/* Commenter Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  {comment.commenter?.avatar_url ? (
                    <img
                      src={comment.commenter.avatar_url}
                      alt={comment.commenter.display_name || ""}
                      className="w-8 h-8 rounded-full bg-[#2C2C2C] object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#2C2C2C] flex items-center justify-center text-xs font-medium text-[#9B9A97]">
                      {(
                        comment.commenter?.display_name ||
                        comment.commenter?.username ||
                        "?"
                      )[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-[#E5E2E1]">
                        {comment.commenter?.display_name ||
                          comment.commenter?.username ||
                          "Unknown"}
                      </p>
                      <span className="text-xs text-[#6B6A68]">
                        {formatRelative(comment.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                {canDeleteComment(comment) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingId === comment.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1.5 text-[#9B9A97] hover:text-red-400 hover:bg-red-500/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Hapus komentar"
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Comment Body */}
              <p className="text-sm text-[#D4D4D4] whitespace-pre-wrap break-words leading-relaxed">
                {comment.body}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      {!readOnly && (
        <form onSubmit={handleAddComment} className="border-t border-[#2D2D2D] pt-4">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              disabled={isLoading}
              placeholder="Tambahkan komentar..."
              rows={1}
              className="flex-1 bg-[#191919] border border-[#2D2D2D] rounded-lg px-3 py-2 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:border-[#3D3D3D]"
            />
            <button
              type="submit"
              disabled={!commentBody.trim() || isLoading}
              className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-[#2D2D2D] disabled:text-[#6B6A68] disabled:cursor-not-allowed"
              title="Kirim komentar"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
