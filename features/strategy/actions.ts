"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import {
  createStrategyNoteSchema,
  updateStrategyNoteSchema,
} from "@/lib/validations/strategy";
import type { Database } from "@/types/database";

type StrategyNote = Database["public"]["Tables"]["strategy_notes"]["Row"];

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface CreateNoteResult {
  ok: true;
  note: StrategyNote;
}

/**
 * Create a strategy note. Captain+ only (RLS enforced).
 */
export async function createStrategyNoteAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | CreateNoteResult> {
  const parsed = createStrategyNoteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgError || !org) return { ok: false, message: "Organisasi tidak ditemukan" };

  const { data: note, error } = await supabase
    .from("strategy_notes")
    .insert({
      organization_id: org.id,
      division_id: parsed.data.division_id ?? "",
      created_by: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      tags: parsed.data.tags,
      visibility: parsed.data.visibility,
    })
    .select("*")
    .single();

  if (error || !note) {
    return {
      ok: false,
      message:
        error?.code === "42501"
          ? "Hanya captain atau owner yang bisa membuat catatan strategi"
          : (error?.message ?? "Gagal membuat catatan"),
    };
  }

  await logAudit({
    actorId: user.id,
    action: "strategy.create",
    entityType: "strategy_note",
    entityId: note.id,
    metadata: { title: note.title },
  });

  revalidatePath(`/${orgSlug}/strategy`);
  return { ok: true, note };
}

/**
 * Update a strategy note. Captain+ or creator only (RLS enforced).
 */
export async function updateStrategyNoteAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = updateStrategyNoteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Form belum lengkap",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("strategy_notes")
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      tags: parsed.data.tags,
      visibility: parsed.data.visibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Anda tidak punya akses untuk mengedit catatan ini"
          : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: "strategy.update",
    entityType: "strategy_note",
    entityId: parsed.data.id,
    metadata: { title: parsed.data.title },
  });

  revalidatePath(`/${orgSlug}/strategy`);
  revalidatePath(`/${orgSlug}/strategy/${parsed.data.id}`);
  return { ok: true };
}

/**
 * Delete a strategy note. Captain+ or creator only (RLS enforced).
 */
export async function deleteStrategyNoteAction(
  orgSlug: string,
  noteId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("strategy_notes")
    .delete()
    .eq("id", noteId);

  if (error) {
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Anda tidak punya akses untuk menghapus catatan ini"
          : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: "strategy.delete",
    entityType: "strategy_note",
    entityId: noteId,
  });

  revalidatePath(`/${orgSlug}/strategy`);
  return { ok: true };
}
