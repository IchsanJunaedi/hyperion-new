"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { blastWaMessage } from "@/lib/utils/fonnte";
import { buildTournamentWaMessage } from "@/lib/utils/wa-templates";
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

  // WA blast to all active members of the org (or division if specified)
  await fanOutTournamentNotifications(supabase, {
    tournamentId: tournament.id,
    orgId: org.id,
    orgSlug,
    divisionId: parsed.data.division_id ?? null,
    name: parsed.data.name,
    organizer: parsed.data.organizer ?? null,
    startDate: parsed.data.start_date,
    endDate: parsed.data.end_date ?? null,
    prizePool: parsed.data.prize_pool ?? null,
    registrationFee: parsed.data.registration_fee ?? null,
    registrationUrl: parsed.data.registration_url ?? null,
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


// ---------------------------------------------------------------------------
// WA Blast for Tournament Creation
// ---------------------------------------------------------------------------

interface TournamentNotifData {
  tournamentId: string;
  orgId: string;
  orgSlug: string;
  divisionId: string | null;
  name: string;
  organizer: string | null;
  startDate: string;
  endDate: string | null;
  prizePool: string | null;
  registrationFee: string | null;
  registrationUrl: string | null;
}

async function fanOutTournamentNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: TournamentNotifData,
) {
  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", data.orgId)
    .maybeSingle();
  const orgName = org?.name ?? "Tim";

  // Get members — if division specified, only that division; otherwise all active members
  let membersQuery = supabase
    .from("team_members")
    .select("user_id")
    .eq("organization_id", data.orgId)
    .eq("is_active", true);

  if (data.divisionId) {
    membersQuery = membersQuery.eq("division_id", data.divisionId);
  }

  const { data: members } = await membersQuery;
  if (!members || members.length === 0) return;

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, phone_wa")
    .in("id", userIds);
  const phoneMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.phone_wa]),
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const tournamentUrl = `${appUrl}/${data.orgSlug}/tournaments/${data.tournamentId}`;

  const waMessage = buildTournamentWaMessage({
    orgName,
    tournamentName: data.name,
    organizer: data.organizer,
    startDate: data.startDate,
    endDate: data.endDate,
    prizePool: data.prizePool,
    registrationFee: data.registrationFee,
    registrationUrl: data.registrationUrl,
    tournamentUrl,
  });

  // Insert notification rows for in-app bell
  const title = `Turnamen baru: ${data.name}`;
  const body = `${orgName} mendaftarkan turnamen ${data.name} mulai ${data.startDate}.`;

  const rows = members.map((m) => ({
    organization_id: data.orgId,
    user_id: m.user_id,
    type: "system" as const,
    title,
    body,
    ref_id: data.tournamentId,
    ref_type: "tournament",
    wa_number: phoneMap.get(m.user_id) ?? null,
    wa_message: phoneMap.get(m.user_id) ? waMessage : null,
  }));

  await supabase.from("notifications").insert(rows);

  // Real-time WA blast
  const recipients = members
    .map((m) => ({ phone: phoneMap.get(m.user_id), message: waMessage }))
    .filter((r): r is { phone: string; message: string } => Boolean(r.phone));

  if (recipients.length > 0) {
    blastWaMessage(recipients).catch((err) =>
      console.error("[WA Blast] Tournament notification error:", err),
    );
  }
}
