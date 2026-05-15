"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  createOpponentProfileSchema,
  updateOpponentProfileSchema,
} from "@/lib/validations/scouting";

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createOpponentProfileAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true; id: string }> {
  const parsed = createOpponentProfileSchema.safeParse(raw);
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

  const { data: profile, error } = await supabase
    .from("opponent_profiles")
    .insert({
      organization_id: org.id,
      opponent_name: parsed.data.opponent_name,
      data: (parsed.data.data ?? {}) as Record<string, unknown>,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !profile) {
    return { ok: false, message: error?.message ?? "Gagal membuat profil lawan" };
  }

  await logAudit({
    actorId: user.id,
    action: "opponent_profile.create",
    entityType: "opponent_profile",
    entityId: profile.id,
  });

  revalidatePath(`/${orgSlug}/scrim`);
  return { ok: true, id: profile.id };
}

export async function updateOpponentProfileAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = updateOpponentProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Form belum lengkap" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("opponent_profiles")
    .update({
      opponent_name: parsed.data.opponent_name,
      data: (parsed.data.data ?? {}) as Record<string, unknown>,
    })
    .eq("id", parsed.data.profile_id);

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "opponent_profile.update",
    entityType: "opponent_profile",
    entityId: parsed.data.profile_id,
  });

  revalidatePath(`/${orgSlug}/scrim`);
  return { ok: true };
}

export async function deleteOpponentProfileAction(
  orgSlug: string,
  profileId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("opponent_profiles")
    .delete()
    .eq("id", profileId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/scrim`);
  return { ok: true };
}
