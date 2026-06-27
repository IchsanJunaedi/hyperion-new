import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeSmartTodos, getManualTodos, getAssignedOutTodos } from "@/features/todos/queries";
import { computeUrgency } from "@/features/todos/logic";
import { TodosPage } from "@/features/todos/components/TodosPage";
import type { ManualTodo, Todo } from "@/features/todos/types";

export const dynamic = "force-dynamic";

const DashboardTodosPage = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, slug")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!org) redirect("/dashboard");

  const [smartTodos, manualRows, assignedOut] = await Promise.all([
    computeSmartTodos(org.id, user.id, org.slug),
    getManualTodos(org.id, user.id),
    getAssignedOutTodos(org.id, user.id),
  ]);

  // Resolve profile names for manual todos that have assigned_to
  const assigneeIds = manualRows.filter((r) => r.assigned_to).map((r) => r.assigned_to!);
  const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
  if (assigneeIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", assigneeIds);
    for (const p of profiles ?? []) profileMap.set(p.id, p);
  }

  const manualTodos: ManualTodo[] = manualRows.map((r) => ({
    id: r.id,
    source: "manual" as const,
    title: r.title,
    due_date: r.due_date ? new Date(r.due_date) : null,
    priority: r.priority as ManualTodo["priority"],
    urgency: computeUrgency(r.due_date ? new Date(r.due_date) : null),
    assigned_to: r.assigned_to
      ? {
          id: r.assigned_to,
          name: profileMap.get(r.assigned_to)?.display_name ?? r.assigned_to,
          avatar_url: profileMap.get(r.assigned_to)?.avatar_url ?? null,
        }
      : null,
    completed_at: r.completed_at ? new Date(r.completed_at) : null,
    created_by: r.created_by,
  }));

  const todos: Todo[] = [...smartTodos, ...manualTodos];

  // Fetch managers for assign dropdown — no org filter, action validates
  const { data: managerMembers } = await admin
    .from("team_members")
    .select("user_id")
    .eq("role", "manager")
    .eq("is_active", true)
    .limit(50);

  const managerIds = [...new Set((managerMembers ?? []).map((m) => m.user_id))];
  const { data: managerProfiles } = managerIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", managerIds)
    : { data: [] };

  const managers = (managerProfiles ?? []).map((p) => ({
    user_id: p.id,
    display_name: p.display_name,
  }));

  return (
    <main className="max-w-[1100px] w-full mx-auto px-4 sm:px-8 py-8">
      <TodosPage
        orgId={org.id}
        todos={todos}
        assignedOutTodos={assignedOut}
        managers={managers}
        isOwner={true}
        revalidatePaths={["/dashboard/todos"]}
      />
    </main>
  );
};

export default DashboardTodosPage;
