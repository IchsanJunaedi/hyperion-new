export type SmartTodoType =
  | "contract_expiry"
  | "salary_due"
  | "member_unassigned"
  | "trial_pending"
  | "scrim_no_result"
  | "sponsor_stale"
  | "tournament_no_bracket";

export type TodoUrgency = "overdue" | "today" | "this_week" | "later";
export type TodoPriority = "low" | "medium" | "high";

export interface SmartTodo {
  id: string; // `${smart_type}:${entity_id}`
  source: "smart";
  smart_type: SmartTodoType;
  title: string;
  urgency: TodoUrgency;
  entity_id: string;
  navigate_to: string;
}

export interface ManualTodo {
  id: string;
  source: "manual";
  title: string;
  due_date: Date | null;
  priority: TodoPriority;
  urgency: TodoUrgency;
  assigned_to: { id: string; name: string; avatar_url: string | null } | null;
  completed_at: Date | null;
  created_by: string;
}

export type Todo = SmartTodo | ManualTodo;

export interface TodoGroup {
  urgency: TodoUrgency;
  label: string;
  todos: Todo[];
}

export interface TodoFilters {
  source: "all" | "smart" | "manual";
  priorities: TodoPriority[];
  categories: SmartTodoType[];
  showCompleted: boolean;
}

export type TodoTab = "all" | "smart" | "manual" | "assigned_out";
