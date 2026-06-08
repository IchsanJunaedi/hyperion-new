"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TodoStatsBar } from "./TodoStatsBar";
import { TodoFilterPanel } from "./TodoFilterPanel";
import { TodoTabBar } from "./TodoTabBar";
import { TodoGroupSection } from "./TodoGroupSection";
import { SmartTodoCard } from "./SmartTodoCard";
import { ManualTodoCard } from "./ManualTodoCard";
import { AssignedOutCard } from "./AssignedOutCard";
import { CreateTodoModal } from "./CreateTodoModal";
import { groupTodos, filterTodos } from "../logic";
import type { Todo, TodoFilters, ManualTodo, TodoTab } from "../types";

interface AssignedOutTodo {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  completed_at: string | null;
  assignee: { id: string; display_name: string | null; avatar_url: string | null } | null;
}

interface Manager { user_id: string; display_name: string | null }

interface Props {
  orgId: string;
  todos: Todo[];
  assignedOutTodos: AssignedOutTodo[];
  managers: Manager[];
  isOwner: boolean;
  revalidatePaths: string[];
}

const DEFAULT_FILTERS: TodoFilters = {
  source: "all",
  priorities: [],
  categories: [],
  showCompleted: false,
};

const TodosPage = ({ orgId, todos, assignedOutTodos, managers, isOwner, revalidatePaths }: Props) => {
  const [filters, setFilters] = useState<TodoFilters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<TodoTab>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const handleTabChange = (tab: TodoTab) => {
    setActiveTab(tab);
    if (tab === "smart") setFilters((f) => ({ ...f, source: "smart" }));
    else if (tab === "manual") setFilters((f) => ({ ...f, source: "manual" }));
    else if (tab === "all") setFilters((f) => ({ ...f, source: "all" }));
  };

  const isAssignedOutTab = activeTab === "assigned_out";
  const filtered = isAssignedOutTab ? [] : filterTodos(todos, filters);
  const groups = groupTodos(filtered);

  const overdueCount = todos.filter((t) => t.urgency === "overdue").length;
  const todayCount = todos.filter((t) => t.urgency === "today").length;
  const totalCount = todos.filter((t) => {
    if (t.source === "manual") return (t as ManualTodo).completed_at === null;
    return true;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Todos</h1>
          <div className="mt-2">
            <TodoStatsBar
              overdueCount={overdueCount}
              todayCount={todayCount}
              totalCount={totalCount}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded border border-[#2D2D2D] bg-[#202020] px-3 py-2 text-sm text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
        >
          <Plus className="h-4 w-4" />
          Tambah
        </button>
      </div>

      {/* Tabs */}
      <TodoTabBar activeTab={activeTab} isOwner={isOwner} onChange={handleTabChange} />

      {/* Body */}
      <div className="flex gap-8">
        {/* Filter sidebar — hidden on assigned_out tab */}
        {!isAssignedOutTab && (
          <TodoFilterPanel filters={filters} onChange={setFilters} />
        )}

        {/* Main list */}
        <div className={cn("min-w-0 flex-1 space-y-1")}>
          {isAssignedOutTab ? (
            assignedOutTodos.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#6B6A68]">
                Belum ada todo yang di-assign ke manager.
              </p>
            ) : (
              <div className="space-y-1.5">
                {assignedOutTodos.map((t) => (
                  <AssignedOutCard key={t.id} todo={t} />
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6B6A68]">
              Tidak ada todos yang cocok.
            </p>
          ) : (
            groups.map((group) => (
              <TodoGroupSection key={group.urgency} label={group.label} count={group.todos.length}>
                {group.todos.map((todo) =>
                  todo.source === "smart" ? (
                    <SmartTodoCard
                      key={todo.id}
                      todo={todo}
                      orgId={orgId}
                      revalidatePaths={revalidatePaths}
                    />
                  ) : (
                    <ManualTodoCard
                      key={todo.id}
                      todo={todo as ManualTodo}
                      revalidatePaths={revalidatePaths}
                    />
                  )
                )}
              </TodoGroupSection>
            ))
          )}
        </div>
      </div>

      {createOpen && (
        <CreateTodoModal
          orgId={orgId}
          managers={managers}
          isOwner={isOwner}
          revalidatePaths={revalidatePaths}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
};

export { TodosPage };
