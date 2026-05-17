"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  createPlayerTargetSchema,
  updatePlayerTargetSchema,
} from "@/lib/validations/player-target";

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createPlayerTargetAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = createPlayerTargetSchema.safeParse(raw);
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

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { ok: false, message: "Organisasi tidak ditemukan" };

  const { data: target, error } = await supabase
    .from("player_targets")
    .insert({
      organization_id: org.id,
      user_id: parsed.data.user_id,
      skill_name: parsed.data.skill_name,
      target_level: parsed.data.target_level,
      current_level: parsed.data.current_level,
      notes: parsed.data.notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !target) {
    return { ok: false, message: error?.message ?? "Gagal membuat target" };
  }

  // Record initial history point
  await supabase.from("player_target_history").insert({
    target_id: target.id,
    level: parsed.data.current_level,
  });

  await logAudit({
    actorId: user.id,
    action: "player_target.create",
    entityType: "player_target",
    entityId: target.id,
  });

  revalidatePath(`/${orgSlug}`);
  revalidatePath("/manage");
  return { ok: true };
}

export async function updatePlayerTargetAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = updatePlayerTargetSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Input tidak valid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("player_targets")
    .update({
      current_level: parsed.data.current_level,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.target_id);

  if (error) return { ok: false, message: error.message };

  // Record history point
  await supabase.from("player_target_history").insert({
    target_id: parsed.data.target_id,
    level: parsed.data.current_level,
  });

  await logAudit({
    actorId: user.id,
    action: "player_target.update",
    entityType: "player_target",
    entityId: parsed.data.target_id,
  });

  revalidatePath(`/${orgSlug}`);
  revalidatePath("/manage");
  return { ok: true };
}

export async function deletePlayerTargetAction(
  orgSlug: string,
  targetId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("player_targets")
    .delete()
    .eq("id", targetId);

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "player_target.delete",
    entityType: "player_target",
    entityId: targetId,
  });

  revalidatePath(`/${orgSlug}`);
  revalidatePath("/manage");
  return { ok: true };
}
