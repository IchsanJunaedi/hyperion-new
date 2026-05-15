"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { createPollSchema, votePollSchema } from "@/lib/validations/poll";

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createPollAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = createPollSchema.safeParse(raw);
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

  const { error } = await supabase.from("polls").insert({
    organization_id: org.id,
    question: parsed.data.question,
    options: parsed.data.options,
    created_by: user.id,
    expires_at: parsed.data.expires_at
      ? new Date(parsed.data.expires_at).toISOString()
      : null,
  });

  if (error) {
    return {
      ok: false,
      message: error.code === "42501"
        ? "Hanya captain atau manager yang bisa membuat poll"
        : error.message,
    };
  }

  await logAudit({
    actorId: user.id,
    action: "poll.create",
    entityType: "poll",
  });

  revalidatePath(`/${orgSlug}/polls`);
  return { ok: true };
}

export async function votePollAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = votePollSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Input tidak valid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // Check if poll is still open
  const { data: poll } = await supabase
    .from("polls")
    .select("is_closed, expires_at, options")
    .eq("id", parsed.data.poll_id)
    .maybeSingle();

  if (!poll) return { ok: false, message: "Poll tidak ditemukan" };
  if (poll.is_closed) return { ok: false, message: "Poll sudah ditutup" };
  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return { ok: false, message: "Poll sudah expired" };
  }

  const options = poll.options as string[];
  if (parsed.data.option_index >= options.length) {
    return { ok: false, message: "Opsi tidak valid" };
  }

  const { error } = await supabase.from("poll_votes").upsert(
    {
      poll_id: parsed.data.poll_id,
      user_id: user.id,
      option_index: parsed.data.option_index,
    },
    { onConflict: "poll_id,user_id" },
  );

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/polls`);
  return { ok: true };
}

export async function closePollAction(
  orgSlug: string,
  pollId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("polls")
    .update({ is_closed: true })
    .eq("id", pollId)
    .eq("created_by", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/polls`);
  return { ok: true };
}
