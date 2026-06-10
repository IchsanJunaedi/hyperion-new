"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { completeManualTodoAction, deleteManualTodoAction } from "../actions";
import { formatRelativeDueDate } from "../logic";
import type { ManualTodo } from "../types";

const BORDER: Record<string, string> = {
  overdue: "border-l-red-500",
  today: "border-l-orange-400",
  this_week: "border-l-yellow-400",
  later: "border-l-zinc-600",
};
const DATE_COLOR: Record<string, string> = {
  overdue: "text-red-400",
  today: "text-orange-400",
  this_week: "text-yellow-400",
  later: "text-ui-text-muted",
};
const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-orange-500/20 text-orange-400",
  low: "bg-zinc-700/60 text-ui-text-2",
};
const PRIORITY_LABEL: Record<string, string> = {
  high: "Tinggi", medium: "Sedang", low: "Rendah",
};

interface Props {
  todo: ManualTodo;
  revalidatePaths: string[];
}

const ManualTodoCard = ({ todo, revalidatePaths }: Props) => {
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isCompleted = todo.completed_at !== null;
  const border = isCompleted ? "border-l-zinc-700" : (BORDER[todo.urgency] ?? "border-l-zinc-600");
  const relDate = formatRelativeDueDate(todo.due_date);

  const handleToggle = async () => {
    setCompleting(true);
    await completeManualTodoAction(todo.id, revalidatePaths);
    setCompleting(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteManualTodoAction(todo.id, revalidatePaths);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-r border-l-2 bg-ui-surface px-4 py-3 transition hover:bg-ui-elevated",
        border,
        (completing || deleting) && "opacity-40 pointer-events-none",
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={completing}
        aria-label={isCompleted ? "Tandai belum selesai" : "Tandai selesai"}
        className="mt-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border border-[#3D3D3D] bg-ui-bg transition hover:border-ui-text-2"
      >
        {isCompleted && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-ui-text-2" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", isCompleted ? "text-ui-text-muted line-through" : "text-ui-text")}>
          {todo.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", PRIORITY_BADGE[todo.priority])}>
            {PRIORITY_LABEL[todo.priority]}
          </span>
          {relDate && (
            <span className={cn("text-xs", DATE_COLOR[isCompleted ? "later" : todo.urgency])}>
              {relDate}
            </span>
          )}
          {todo.assigned_to && (
            <span className="text-xs text-ui-text-muted">→ {todo.assigned_to.name}</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Hapus todo"
        className="cursor-pointer rounded p-1 text-ui-text-muted transition hover:bg-ui-hover hover:text-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export { ManualTodoCard };
