"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import {
  createScrimRequestSchema,
  respondScrimRequestSchema,
} from "@/lib/validations/matchmaking";

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Send a scrim request to another team.
 */
export async function createScrimRequestAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = createScrimRequestSchema.safeParse(raw);
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

  const { error } = await supabase.from("scrim_requests").insert({
    from_org_id: org.id,
    to_org_id: parsed.data.to_org_id,
    division_id: parsed.data.division_id,
    message: parsed.data.message,
    preferred_time: parsed.data.preferred_time
      ? new Date(parsed.data.preferred_time).toISOString()
      : null,
    format: parsed.data.format,
    created_by: user.id,
  });

  if (error) {
    return {
      ok: false,
      message: error.code === "42501"
        ? "Hanya captain atau manager yang bisa mengirim request"
        : error.message,
    };
  }

  // Notify captain of target org
  const admin = createAdminClient();
  const { data: targetCaptains } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", parsed.data.to_org_id)
    .in("role", ["captain", "manager"])
    .eq("is_active", true);

  if (targetCaptains && targetCaptains.length > 0) {
    const { data: fromOrg } = await admin
      .from("organizations")
      .select("name")
      .eq("id", org.id)
      .maybeSingle();

    const notifRows = targetCaptains.map((m) => ({
      organization_id: parsed.data.to_org_id,
      user_id: m.user_id,
      type: "system" as const,
      title: `Request scrim dari ${fromOrg?.name ?? "tim lain"}`,
      body: parsed.data.message ?? "Ada tim yang ingin scrim dengan kalian!",
    }));
    await admin.from("notifications").insert(notifRows);
  }

  await logAudit({
    actorId: user.id,
    action: "scrim_request.create",
    entityType: "scrim_request",
    metadata: { to_org_id: parsed.data.to_org_id },
  });

  revalidatePath(`/${orgSlug}/scrim`);
  return { ok: true };
}

/**
 * Respond to a scrim request (accept/decline).
 */
export async function respondScrimRequestAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = respondScrimRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Input tidak valid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("scrim_requests")
    .update({
      status: parsed.data.status,
      responded_by: user.id,
      responded_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.request_id);

  if (error) {
    return {
      ok: false,
      message: error.code === "42501"
        ? "Anda tidak punya akses untuk merespon request ini"
        : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: `scrim_request.${parsed.data.status}`,
    entityType: "scrim_request",
    entityId: parsed.data.request_id,
  });

  revalidatePath(`/${orgSlug}/scrim`);
  return { ok: true };
}
