import type { Todo, TodoUrgency, TodoGroup, TodoFilters, ManualTodo } from "./types";

const URGENCY_ORDER: TodoUrgency[] = ["overdue", "today", "this_week", "later"];
const GROUP_LABELS: Record<TodoUrgency, string> = {
  overdue: "TERLAMBAT",
  today: "HARI INI",
  this_week: "MINGGU INI",
  later: "NANTI",
};

export function computeUrgency(dueDate: Date | null, now = new Date()): TodoUrgency {
  if (!dueDate) return "later";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 7) return "this_week";
  return "later";
}

export function formatRelativeDueDate(dueDate: Date | null, now = new Date()): string {
  if (!dueDate) return "";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Hari ini";
  if (diffDays < 0) return `Terlambat ${Math.abs(diffDays)} hari`;
  return `${diffDays} hari lagi`;
}

export function groupTodos(todos: Todo[]): TodoGroup[] {
  const map = new Map<TodoUrgency, Todo[]>(URGENCY_ORDER.map((u) => [u, []]));
  for (const todo of todos) map.get(todo.urgency)!.push(todo);
  return URGENCY_ORDER.map((urgency) => ({
    urgency,
    label: GROUP_LABELS[urgency],
    todos: map.get(urgency)!,
  }));
}

export function filterTodos(todos: Todo[], filters: TodoFilters): Todo[] {
  return todos.filter((todo) => {
    if (filters.source === "smart" && todo.source !== "smart") return false;
    if (filters.source === "manual" && todo.source !== "manual") return false;
    if (filters.categories.length > 0 && todo.source === "smart") {
      if (!filters.categories.includes(todo.smart_type)) return false;
    }
    if (filters.priorities.length > 0 && todo.source === "manual") {
      if (!filters.priorities.includes((todo as ManualTodo).priority)) return false;
    }
    if (!filters.showCompleted && todo.source === "manual") {
      if ((todo as ManualTodo).completed_at !== null) return false;
    }
    return true;
  });
}
