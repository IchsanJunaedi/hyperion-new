import { cn } from "@/lib/utils/cn";
import { computeUrgency, formatRelativeDueDate } from "../logic";

interface AssignedOutTodo {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  completed_at: string | null;
  assignee: { id: string; display_name: string | null; avatar_url: string | null } | null;
}

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-orange-500/20 text-orange-400",
  low: "bg-zinc-700/60 text-[#9B9A97]",
};

const AssignedOutCard = ({ todo }: { todo: AssignedOutTodo }) => {
  const isCompleted = !!todo.completed_at;
  const dueDate = todo.due_date ? new Date(todo.due_date) : null;
  const urgency = computeUrgency(dueDate);
  const relDate = formatRelativeDueDate(dueDate);

  const BORDER: Record<string, string> = {
    overdue: "border-l-red-500",
    today: "border-l-orange-400",
    this_week: "border-l-yellow-400",
    later: "border-l-zinc-600",
  };
  const border = isCompleted ? "border-l-zinc-700" : (BORDER[urgency] ?? "border-l-zinc-600");

  return (
    <div className={cn("flex items-start gap-3 rounded-r border-l-2 bg-[#202020] px-4 py-3", border)}>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", isCompleted ? "text-[#6B6A68] line-through" : "text-[#E5E2E1]")}>
          {todo.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", PRIORITY_BADGE[todo.priority] ?? "bg-zinc-700/60 text-[#9B9A97]")}>
            {todo.priority}
          </span>
          {relDate && <span className="text-xs text-[#6B6A68]">{relDate}</span>}
          {todo.assignee && (
            <span className="text-xs text-[#6B6A68]">
              → {todo.assignee.display_name ?? todo.assignee.id}
            </span>
          )}
        </div>
      </div>
      <span className={cn(
        "shrink-0 rounded px-2 py-0.5 text-[10px] font-medium",
        isCompleted ? "bg-green-500/20 text-green-400" : "bg-zinc-700/60 text-[#9B9A97]",
      )}>
        {isCompleted ? "Selesai" : "Pending"}
      </span>
    </div>
  );
};

export { AssignedOutCard };
