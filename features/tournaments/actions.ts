"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  createTournamentSchema,
  updateTournamentSchema,
  createTournamentStageSchema,
} from "@/lib/validations/tournament";

export interface ActionError {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createTournamentAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true; id: string }> {
  const parsed = createTournamentSchema.safeParse(raw);
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

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      organization_id: org.id,
      division_id: parsed.data.division_id,
      name: parsed.data.name,
      organizer: parsed.data.organizer,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      prize_pool: parsed.data.prize_pool,
      registration_fee: parsed.data.registration_fee,
      registration_url: parsed.data.registration_url,
      notes: parsed.data.notes,
      status: "upcoming",
    })
    .select("id")
    .single();

  if (error || !tournament) {
    return {
      ok: false,
      message: error?.code === "42501"
        ? "Hanya captain atau manager yang bisa menambah turnamen"
        : (error?.message ?? "Gagal membuat turnamen"),
    };
  }

  await logAudit({
    actorId: user.id,
    action: "tournament.create",
    entityType: "tournament",
    entityId: tournament.id,
  });

  revalidatePath(`/${orgSlug}/tournaments`);
  return { ok: true, id: tournament.id };
}

export async function updateTournamentAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = updateTournamentSchema.safeParse(raw);
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
    .from("tournaments")
    .update({
      division_id: parsed.data.division_id,
      name: parsed.data.name,
      organizer: parsed.data.organizer,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      prize_pool: parsed.data.prize_pool,
      registration_fee: parsed.data.registration_fee,
      registration_url: parsed.data.registration_url,
      notes: parsed.data.notes,
    })
    .eq("id", parsed.data.tournament_id);

  if (error) {
    return { ok: false, message: error.message };
  }

  await logAudit({
    actorId: user.id,
    action: "tournament.update",
    entityType: "tournament",
    entityId: parsed.data.tournament_id,
  });

  revalidatePath(`/${orgSlug}/tournaments`);
  return { ok: true };
}

export async function deleteTournamentAction(
  orgSlug: string,
  tournamentId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", tournamentId);

  if (error) {
    return { ok: false, message: error.code === "42501" ? "Akses ditolak" : error.message };
  }

  await logAudit({
    actorId: user.id,
    action: "tournament.delete",
    entityType: "tournament",
    entityId: tournamentId,
  });

  revalidatePath(`/${orgSlug}/tournaments`);
  return { ok: true };
}

export async function updateTournamentStatusAction(
  orgSlug: string,
  tournamentId: string,
  status: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // DB uses text check: upcoming/ongoing/completed/cancelled
  const { error } = await supabase
    .from("tournaments")
    .update({ status: status as "upcoming" | "ongoing" | "completed" | "cancelled" })
    .eq("id", tournamentId);

  if (error) return { ok: false, message: error.message };

  // When confirming registration (upcoming → ongoing), auto-add finance expense
  if (status === "ongoing") {
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("organization_id, name, registration_fee")
      .eq("id", tournamentId)
      .maybeSingle();

    if (tournament?.registration_fee) {
      const amount = parseInt(tournament.registration_fee.replace(/\D/g, ""), 10);
      if (amount > 0) {
        await supabase.from("finances").insert({
          organization_id: tournament.organization_id,
          type: "expense",
          amount,
          category: "Turnamen",
          description: `Biaya registrasi: ${tournament.name}`,
          date: new Date().toISOString().slice(0, 10),
          created_by: user.id,
        });
      }
    }
  }

  await logAudit({
    actorId: user.id,
    action: `tournament.status.${status}`,
    entityType: "tournament",
    entityId: tournamentId,
  });

  revalidatePath(`/${orgSlug}/tournaments`);
  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  revalidatePath("/manage/finances");
  revalidatePath("/dashboard/finances");
  return { ok: true };
}

export async function createTournamentStageAction(
  orgSlug: string,
  raw: unknown,
): Promise<ActionError | { ok: true }> {
  const parsed = createTournamentStageSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Form belum lengkap" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase.from("tournament_stages").insert({
    tournament_id: parsed.data.tournament_id,
    stage_name: parsed.data.stage_name,
    scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
    notes: parsed.data.notes,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/tournaments`);
  return { ok: true };
}

export async function toggleStageCompleteAction(
  orgSlug: string,
  stageId: string,
  isCompleted: boolean,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error } = await supabase
    .from("tournament_stages")
    .update({ is_completed: isCompleted })
    .eq("id", stageId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/tournaments`);
  return { ok: true };
}
