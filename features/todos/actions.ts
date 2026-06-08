"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createManualTodoSchema,
  dismissSmartTodoSchema,
} from "@/lib/validations/todos";

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

interface ActionSuccess {
  ok: true;
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function revalidatePaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

/**
 * Create a manual todo for the organization.
 * Users can assign to any manager in the org.
 */
export async function createManualTodoAction(
  orgId: string,
  raw: unknown,
  paths: string[] = [],
): Promise<ActionSuccess | ActionError> {
  const user = await getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login" };
  }

  const parsed = createManualTodoSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { title, due_date, priority, assigned_to } = parsed.data;

  const admin = createAdminClient();

  // Validate assigned_to is a real manager in this org
  if (assigned_to) {
    const { data: member, error: memberError } = await admin
      .from("team_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", assigned_to)
      .eq("role", "manager")
      .eq("is_active", true)
      .maybeSingle();

    if (memberError) {
      console.error("[todos] createManualTodoAction (member check):", memberError.message);
    }

    if (!member) {
      return {
        ok: false,
        message: "Target user tidak ditemukan atau bukan manager di organisasi ini",
      };
    }
  }

  const { data: todo, error } = await admin
    .from("manual_todos")
    .insert({
      org_id: orgId,
      created_by: user.id,
      assigned_to: assigned_to ?? null,
      title,
      due_date: due_date ?? null,
      priority,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[todos] createManualTodoAction:", error.message);
    return { ok: false, message: "Gagal membuat todo." };
  }

  if (!todo) {
    return { ok: false, message: "Gagal membuat todo." };
  }

  await logAudit({
    actorId: user.id,
    action: "todo.create",
    entityType: "todo",
    entityId: todo.id,
    metadata: { title, orgId },
  });

  revalidatePaths(paths);
  return { ok: true };
}

/**
 * Toggle completion status (complete/uncomplete) of a manual todo.
 * Only creator or assignee can toggle.
 */
export async function completeManualTodoAction(
  todoId: string,
  paths: string[] = [],
): Promise<ActionSuccess | ActionError> {
  const user = await getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login" };
  }

  const admin = createAdminClient();
  const { data: todo, error: fetchError } = await admin
    .from("manual_todos")
    .select("id, created_by, assigned_to, completed_at")
    .eq("id", todoId)
    .maybeSingle();

  if (fetchError) {
    console.error("[todos] completeManualTodoAction (fetch):", fetchError.message);
  }

  if (!todo) {
    return { ok: false, message: "Todo tidak ditemukan" };
  }

  // Check auth: creator or assignee
  if (todo.created_by !== user.id && todo.assigned_to !== user.id) {
    return { ok: false, message: "Akses ditolak" };
  }

  // Toggle: if completed, set to null; if not completed, set to now
  const newCompletedAt = todo.completed_at ? null : new Date().toISOString();

  const { error } = await admin
    .from("manual_todos")
    .update({ completed_at: newCompletedAt })
    .eq("id", todoId);

  if (error) {
    console.error("[todos] completeManualTodoAction (update):", error.message);
    return { ok: false, message: "Gagal memperbarui todo." };
  }

  await logAudit({
    actorId: user.id,
    action: newCompletedAt ? "todo.complete" : "todo.uncomplete",
    entityType: "todo",
    entityId: todoId,
    metadata: { completed: !!newCompletedAt },
  });

  revalidatePaths(paths);
  return { ok: true };
}

/**
 * Delete a manual todo.
 * Only creator can delete.
 */
export async function deleteManualTodoAction(
  todoId: string,
  paths: string[] = [],
): Promise<ActionSuccess | ActionError> {
  const user = await getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login" };
  }

  const admin = createAdminClient();
  const { data: todo, error: fetchError } = await admin
    .from("manual_todos")
    .select("id, created_by, title")
    .eq("id", todoId)
    .maybeSingle();

  if (fetchError) {
    console.error("[todos] deleteManualTodoAction (fetch):", fetchError.message);
  }

  if (!todo) {
    return { ok: false, message: "Todo tidak ditemukan" };
  }

  // Only creator can delete
  if (todo.created_by !== user.id) {
    return { ok: false, message: "Hanya pembuat todo yang bisa menghapus" };
  }

  const { error } = await admin.from("manual_todos").delete().eq("id", todoId);

  if (error) {
    console.error("[todos] deleteManualTodoAction (delete):", error.message);
    return { ok: false, message: "Gagal menghapus todo." };
  }

  await logAudit({
    actorId: user.id,
    action: "todo.delete",
    entityType: "todo",
    entityId: todoId,
    metadata: { title: todo.title },
  });

  revalidatePaths(paths);
  return { ok: true };
}

/**
 * Dismiss a smart todo for the current user.
 * Uses upsert to track dismissals per user/type/entity combination.
 */
export async function dismissSmartTodoAction(
  orgId: string,
  raw: unknown,
  paths: string[] = [],
): Promise<ActionSuccess | ActionError> {
  const user = await getUser();
  if (!user) {
    return { ok: false, message: "Anda harus login" };
  }

  const parsed = dismissSmartTodoSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { smart_type, entity_id } = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin.from("todo_dismissals").upsert(
    {
      org_id: orgId,
      user_id: user.id,
      smart_type: smart_type,
      entity_id: entity_id,
    },
    { onConflict: "user_id,smart_type,entity_id" },
  );

  if (error) {
    console.error("[todos] dismissSmartTodoAction:", error.message);
    return { ok: false, message: "Gagal dismiss todo." };
  }

  await logAudit({
    actorId: user.id,
    action: "todo.dismiss",
    entityType: "todo_dismissal",
    entityId: `${smart_type}:${entity_id}`,
    metadata: { smart_type, orgId },
  });

  revalidatePaths(paths);
  return { ok: true };
}
