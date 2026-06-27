import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeSmartTodos,
  getManualTodos,
  getAssignedToMeTodos,
} from "@/features/todos/queries";
import { computeUrgency } from "@/features/todos/logic";
import { TodosPage } from "@/features/todos/components/TodosPage";
import type { ManualTodo, Todo } from "@/features/todos/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageTodosPage = async ({ params }: Props) => {
  const { orgSlug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/manage/${orgSlug}/todos`);

  const ownerEmail = process.env.OWNER_EMAIL;
  if (ownerEmail && user.email === ownerEmail) redirect("/dashboard/todos");

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, slug")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .eq("role", "manager")
    .eq("is_active", true)
    .maybeSingle();

  if (!membership) redirect("/manage");

  const [smartTodos, myManualRows, assignedToMeRows] = await Promise.all([
    computeSmartTodos(org.id, user.id, orgSlug),
    getManualTodos(org.id, user.id),
    getAssignedToMeTodos(org.id, user.id),
  ]);

  const allManualRows = [...myManualRows, ...assignedToMeRows];

  const manualTodos: ManualTodo[] = allManualRows.map((r) => ({
    id: r.id,
    source: "manual" as const,
    title: r.title,
    due_date: r.due_date ? new Date(r.due_date) : null,
    priority: r.priority as ManualTodo["priority"],
    urgency: computeUrgency(r.due_date ? new Date(r.due_date) : null),
    assigned_to: null,
    completed_at: r.completed_at ? new Date(r.completed_at) : null,
    created_by: r.created_by,
  }));

  const todos: Todo[] = [...smartTodos, ...manualTodos];

  return (
    <main className="max-w-[1100px] w-full mx-auto px-4 sm:px-8 py-8">
      <TodosPage
        orgId={org.id}
        todos={todos}
        assignedOutTodos={[]}
        managers={[]}
        isOwner={false}
        revalidatePaths={[`/manage/${orgSlug}/todos`]}
      />
    </main>
  );
};

export default ManageTodosPage;
