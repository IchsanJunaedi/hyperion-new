"use client";

import { useState } from "react";
import {
  X, ExternalLink, AlertCircle, Users, Swords, Handshake, Trophy
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { dismissSmartTodoAction } from "../actions";
import type { SmartTodo, SmartTodoType } from "../types";

const BORDER: Record<string, string> = {
  overdue: "border-l-red-500",
  today: "border-l-orange-400",
  this_week: "border-l-yellow-400",
  later: "border-l-zinc-600",
};
const ICON_COLOR: Record<string, string> = {
  overdue: "text-red-400",
  today: "text-orange-400",
  this_week: "text-yellow-400",
  later: "text-ui-text-muted",
};
const TYPE_ICON: Record<SmartTodoType, React.ComponentType<{ className?: string }>> = {
  contract_expiry: AlertCircle,
  salary_due: AlertCircle,
  member_unassigned: Users,
  trial_pending: Users,
  scrim_no_result: Swords,
  sponsor_stale: Handshake,
  tournament_no_bracket: Trophy,
};

interface Props {
  todo: SmartTodo;
  orgId: string;
  revalidatePaths: string[];
}

const SmartTodoCard = ({ todo, orgId, revalidatePaths }: Props) => {
  const [dismissing, setDismissing] = useState(false);

  const handleDismiss = async () => {
    setDismissing(true);
    await dismissSmartTodoAction(
      orgId,
      { smart_type: todo.smart_type, entity_id: todo.entity_id },
      revalidatePaths,
    );
  };

  const Icon = TYPE_ICON[todo.smart_type];
  const isNavigable = todo.navigate_to && !todo.navigate_to.startsWith("#");

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-r border-l-2 bg-ui-surface px-4 py-3 transition hover:bg-ui-elevated",
        BORDER[todo.urgency] ?? "border-l-zinc-600",
        dismissing && "opacity-40 pointer-events-none",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", ICON_COLOR[todo.urgency] ?? "text-ui-text-muted")} />
      <p className="min-w-0 flex-1 truncate text-sm text-ui-text">{todo.title}</p>
      <div className="flex shrink-0 items-center gap-1">
        {isNavigable && (
          <Link
            href={todo.navigate_to}
            className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text-dim"
          >
            Buka <ExternalLink className="h-3 w-3" />
          </Link>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismissing}
          aria-label="Dismiss"
          className="cursor-pointer rounded p-1 text-ui-text-muted transition hover:bg-ui-hover hover:text-ui-text-2"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export { SmartTodoCard };
