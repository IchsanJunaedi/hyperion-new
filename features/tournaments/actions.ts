"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { blastWaMessage } from "@/lib/utils/fonnte";
import { buildTournamentRegisteredWaMessage, buildTournamentWonWaMessage } from "@/lib/utils/wa-templates";
import {
  createTournamentSchema,
  updateTournamentSchema,
  createTournamentStageSchema,
} from "@/lib/validations/tournament";
import { shouldAutoCreateAchievement, buildAchievementTitle } from "./achievement-helpers";
import { slugify } from "@/lib/utils/slugify";

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

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { ok: false, message: "Organisasi tidak ditemukan" };

  // Server-side authorization: owner by email, or captain/manager in team_members
  const ownerEmail = process.env.OWNER_EMAIL || process.env.E2E_OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);
  if (!isOwner) {
    const { data: membership } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", org.id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    const canCreate = membership?.role && ["captain", "coach", "manager", "owner"].includes(membership.role);
    if (!canCreate) return { ok: false, message: "Hanya captain, coach, atau manager yang bisa menambah turnamen" };
  }

  // Auto-detect status: if start_date is in the past, mark as completed immediately
  // Use end of day WIB for comparison (a tournament on today is still valid)
  const endOfStartDay = new Date(parsed.data.start_date + "T23:59:59+07:00");
  const isHistorical = endOfStartDay < new Date();

  const { data: tournament, error } = await admin
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
      start_time: parsed.data.start_time ?? null,
      registration_deadline: parsed.data.registration_deadline ?? null,
      location_type: parsed.data.location_type ?? null,
      location: parsed.data.location ?? null,
      status: isHistorical ? "completed" : "upcoming",
      // Mark all reminders as sent for historical entries so they don't trigger
      h30_reminder_sent_at: isHistorical ? new Date().toISOString() : null,
      h1_reminder_sent_at: isHistorical ? new Date().toISOString() : null,
      day_reminder_sent_at: isHistorical ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !tournament) {
    return {
      ok: false,
      message: error?.message ?? "Gagal membuat turnamen",
    };
  }

  await logAudit({
    actorId: user.id,
    action: "tournament.create",
    entityType: "tournament",
    entityId: tournament.id,
  });

  // Skip WA blast for historical tournaments
  if (!isHistorical && parsed.data.send_wa_blast) {
    await fanOutTournamentNotifications(
      supabase,
      {
        id: tournament.id,
        name: parsed.data.name,
        start_date: parsed.data.start_date,
        start_time: parsed.data.start_time ?? null,
        location_type: parsed.data.location_type ?? null,
        location: parsed.data.location ?? null,
        online_platform: parsed.data.online_platform ?? null,
        organization_id: org.id,
      },
      org.name,
      parsed.data.division_id,
    );
  }

  revalidatePath(`/${orgSlug}/tournaments`);
  return { ok: true, id: tournament.id };
}

async function fanOutTournamentNotifications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournament: {
    id: string;
    name: string;
    start_date: string;
    start_time: string | null;
    location_type: string | null;
    location: string | null;
    online_platform: string | null;
    organization_id: string;
  },
  orgName: string,
  divisionId: string,
) {
  let membersQuery = supabase
    .from("team_members")
    .select("user_id")
    .eq("organization_id", tournament.organization_id)
    .eq("is_active", true)
    .limit(500);

  if (divisionId) {
    membersQuery = membersQuery.eq("division_id", divisionId);
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

  const title = `Turnamen Baru: ${tournament.name}`;
  const startStr = tournament.start_time
    ? `${tournament.start_date} pukul ${tournament.start_time}`
    : tournament.start_date;
  const locationStr = tournament.location_type
    ? tournament.location_type === "online"
      ? `Online${tournament.online_platform ? ` - ${tournament.online_platform}` : ""}`
      : tournament.location_type === "hybrid"
        ? `Hybrid${tournament.location ? ` - Offline: ${tournament.location}` : ""}${tournament.online_platform ? ` / Online: ${tournament.online_platform}` : ""}`
        : `Offline${tournament.location ? ` - ${tournament.location}` : ""}`
    : "—";

  const waMessage = [
    `[${orgName}] Turnamen Baru`,
    `🏆 Turnamen: ${tournament.name}`,
    `📅 Mulai: ${startStr}`,
    `📍 Lokasi: ${locationStr}`,
    "",
    "Persiapkan tim Anda dan buka aplikasi untuk info selengkapnya.",
  ].join("\n");

  const rows = members.map((m) => ({
    organization_id: tournament.organization_id,
    user_id: m.user_id,
    type: "system" as const,
    title,
    body: `Turnamen Baru: ${tournament.name}. Mulai ${startStr}. Lokasi: ${locationStr}`,
    ref_id: tournament.id,
    ref_type: "tournament",
    wa_number: phoneMap.get(m.user_id) ?? null,
    wa_message: phoneMap.get(m.user_id) ? waMessage : null,
  }));

  await supabase.from("notifications").insert(rows);
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

  const admin = createAdminClient();
  const { error } = await admin
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
      start_time: parsed.data.start_time ?? null,
      registration_deadline: parsed.data.registration_deadline ?? null,
      location_type: parsed.data.location_type ?? null,
      location: parsed.data.location ?? null,
      h1_reminder_sent_at: null,
      day_reminder_sent_at: null,
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

  const admin = createAdminClient();
  const { error } = await admin
    .from("tournaments")
    .delete()
    .eq("id", tournamentId);

  if (error) {
    return { ok: false, message: error.message };
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

  const admin = createAdminClient();

  // Guard: block registration confirmation if deadline has passed
  if (status === "ongoing") {
    const { data: existing } = await admin
      .from("tournaments")
      .select("status, registration_deadline")
      .eq("id", tournamentId)
      .maybeSingle();
    if (
      existing?.status === "upcoming" &&
      existing.registration_deadline != null &&
      new Date(existing.registration_deadline).getTime() < Date.now()
    ) {
      return { ok: false, message: "Batas pendaftaran sudah lewat, tidak bisa dikonfirmasi." };
    }
  }

  // DB uses text check: upcoming/ongoing/completed/cancelled
  const updateFields: { status: "upcoming" | "ongoing" | "completed" | "cancelled"; is_registered?: boolean } = {
    status: status as "upcoming" | "ongoing" | "completed" | "cancelled"
  };
  if (status === "ongoing") {
    updateFields.is_registered = true;
  }

  const { error } = await admin
    .from("tournaments")
    .update(updateFields)
    .eq("id", tournamentId);

  if (error) return { ok: false, message: error.message };

  // When confirming registration (upcoming → ongoing)
  if (status === "ongoing") {
    const { data: tournament } = await admin
      .from("tournaments")
      .select("organization_id, name, organizer, start_date, registration_fee, prize_pool")
      .eq("id", tournamentId)
      .maybeSingle();

    if (tournament) {
      // Auto-add finance expense if there's a registration fee
      if (tournament.registration_fee) {
        const amount = parseInt(tournament.registration_fee.replace(/\D/g, ""), 10);
        if (amount > 0) {
          await admin.from("finances").insert({
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

      // WA + in-app notification blast to all members
      fanOutRegistrationNotification(admin, {
        tournamentId,
        orgId: tournament.organization_id,
        orgSlug,
        name: tournament.name,
        organizer: tournament.organizer ?? null,
        startDate: tournament.start_date,
        prizePool: tournament.prize_pool ?? null,
      }).catch((err) => console.error("[WA] Registration notification error:", err));
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
  revalidatePath("/manage", "layout");
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

export async function addTournamentMatchAction(
  orgSlug: string,
  tournamentId: string,
  raw: {
    stage_id: string;
    round_label: string;
    opponent_name?: string;
    our_score?: number | null;
    opponent_score?: number | null;
    is_win?: boolean | null;
    notes?: string;
    played_at?: string;
  },
): Promise<ActionError | { ok: true }> {
  if (!raw.round_label?.trim()) {
    return { ok: false, message: "Label ronde wajib diisi" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("tournament_matches").insert({
    stage_id: raw.stage_id,
    round_label: raw.round_label.trim(),
    opponent_name: raw.opponent_name?.trim() || null,
    our_score: raw.our_score ?? null,
    opponent_score: raw.opponent_score ?? null,
    is_win: raw.is_win ?? null,
    notes: raw.notes?.trim() || null,
    played_at: raw.played_at ? new Date(raw.played_at).toISOString() : null,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { ok: true };
}

export async function updateTournamentMatchAction(
  orgSlug: string,
  tournamentId: string,
  matchId: string,
  raw: {
    round_label: string;
    opponent_name?: string;
    our_score?: number | null;
    opponent_score?: number | null;
    is_win?: boolean | null;
  },
): Promise<ActionError | { ok: true }> {
  if (!raw.round_label?.trim()) {
    return { ok: false, message: "Label ronde wajib diisi" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("tournament_matches")
    .update({
      round_label: raw.round_label.trim(),
      opponent_name: raw.opponent_name?.trim() || null,
      our_score: raw.our_score ?? null,
      opponent_score: raw.opponent_score ?? null,
      is_win: raw.is_win ?? null,
    })
    .eq("id", matchId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { ok: true };
}

export async function deleteTournamentMatchAction(
  orgSlug: string,
  tournamentId: string,
  matchId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("tournament_matches")
    .delete()
    .eq("id", matchId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { ok: true };
}

export async function updateTournamentBracketAction(
  orgSlug: string,
  tournamentId: string,
  bracketLink: string | null,
  bracketFilePath: string | null,
): Promise<ActionError | { ok: true }> {
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

  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  const ownerEmail = process.env.OWNER_EMAIL || process.env.E2E_OWNER_EMAIL;
  const isGlobalOwner = user.email && user.email === ownerEmail;

  const { data: orgWithOwner } = await supabase
    .from("organizations")
    .select("owner_id")
    .eq("id", org.id)
    .maybeSingle();
  const isOrgOwner = orgWithOwner?.owner_id === user.id;

  const role = member?.role;
  const canUpdateBracket = isGlobalOwner || isOrgOwner || (role && ["captain", "manager", "coach"].includes(role));

  if (!canUpdateBracket) {
    return { ok: false, message: "Hanya manager, coach, dan captain yang dapat mengatur bracket" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("tournaments")
    .update({
      bracket_link: bracketLink || null,
      bracket_file_path: bracketFilePath || null,
    })
    .eq("id", tournamentId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await logAudit({
    actorId: user.id,
    action: "tournament.update_bracket",
    entityType: "tournament",
    entityId: tournamentId,
  });

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { ok: true };
}


export async function updateTournamentTechMeetAction(
  orgSlug: string,
  tournamentId: string,
  data: {
    tech_meet_date: string | null;
    tech_meet_time: string | null;
    tech_meet_link: string | null;
  },
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("tournaments")
    .update({
      tech_meet_date: data.tech_meet_date || null,
      tech_meet_time: data.tech_meet_time || null,
      tech_meet_link: data.tech_meet_link || null,
    })
    .eq("id", tournamentId);

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "tournament.update_tech_meet",
    entityType: "tournament",
    entityId: tournamentId,
  });

  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  return { ok: true };
}

export async function completeTournamentAction(
  orgSlug: string,
  tournamentId: string,
  data: {
    won: boolean;
    placement?: number | null;
    prizeEarned?: string | null;
    eliminatedRound?: number | null;
    notes?: string | null;
  },
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const { error: statusError } = await supabase
    .from("tournaments")
    .update({ status: "completed" })
    .eq("id", tournamentId);

  if (statusError) return { ok: false, message: statusError.message };

  const notesValue = data.won
    ? (data.notes ?? null)
    : `Gugur babak ${data.eliminatedRound ?? "penyisihan"}${data.notes ? ` — ${data.notes}` : ""}`;

  const admin = createAdminClient();
  const { error: resultError } = await admin.from("tournament_results").upsert(
    {
      tournament_id: tournamentId,
      placement: data.won ? (data.placement ?? null) : null,
      prize_earned: data.won && data.prizeEarned ? data.prizeEarned.replace(/\D/g, "") : null,
      notes: notesValue,
      recorded_by: user.id,
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "tournament_id" },
  );

  if (resultError) return { ok: false, message: resultError.message };

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (org) {
    const prizeAmount = data.won && data.prizeEarned
      ? parseInt(data.prizeEarned.replace(/\D/g, ""), 10)
      : 0;

    // Auto-add prize income to finances
    if (prizeAmount > 0) {
      await admin.from("finances").insert({
        organization_id: org.id,
        type: "income",
        amount: prizeAmount,
        category: "Hadiah Turnamen",
        description: `Prize turnamen${data.placement ? ` — Juara ${data.placement}` : ""}`,
        date: new Date().toISOString().slice(0, 10),
        created_by: user.id,
      });
    }

    // Auto-distribute bonus to each active contract with bonus_percentage > 0
    if (prizeAmount > 0) {
      const { data: contracts } = await admin
        .from("player_contracts")
        .select("id, user_id, bonus_percentage")
        .eq("organization_id", org.id)
        .eq("status", "active")
        .gt("bonus_percentage", 0);

      if (contracts && contracts.length > 0) {
        const { data: tournamentRow } = await admin
          .from("tournaments")
          .select("name")
          .eq("id", tournamentId)
          .maybeSingle();
        const tournamentName = tournamentRow?.name ?? "Turnamen";

        const distributions = contracts.map((c) => ({
          tournament_id: tournamentId,
          contract_id: c.id,
          organization_id: org.id,
          user_id: c.user_id,
          tournament_name: tournamentName,
          placement: data.placement ?? null,
          bonus_amount: Math.round((prizeAmount * Number(c.bonus_percentage)) / 100),
          bonus_percentage: Number(c.bonus_percentage),
        }));

        await admin
          .from("tournament_bonus_distributions")
          .upsert(distributions, { onConflict: "tournament_id,contract_id" });
      }
    }

    // WA blast to all members on win
    if (data.won && prizeAmount > 0 && data.placement) {
      const { data: tournamentRow } = await admin
        .from("tournaments")
        .select("name")
        .eq("id", tournamentId)
        .maybeSingle();
      const tName = tournamentRow?.name ?? "Turnamen";

      const { data: winContracts } = await admin
        .from("player_contracts")
        .select("user_id, bonus_percentage")
        .eq("organization_id", org.id)
        .eq("status", "active");
      const bonusMap = new Map(
        (winContracts ?? []).map((c) => [c.user_id, Number(c.bonus_percentage)]),
      );

      fanOutWinNotification(admin, {
        tournamentId,
        orgId: org.id,
        orgSlug,
        tournamentName: tName,
        placement: data.placement,
        prizeAmount,
        bonusMap,
      }).catch((err) => console.error("[WA] Win notification error:", err));
    }
  }

  // Auto-create achievement for podium placements
  if (org && shouldAutoCreateAchievement(data.placement)) {
    const { data: tournamentRow, error: tErr } = await admin
      .from("tournaments")
      .select("name, division_id, end_date")
      .eq("id", tournamentId)
      .maybeSingle();
    if (tErr) console.error("completeTournamentAction: fetch tournament for achievement:", tErr);
    if (tournamentRow) {
      let divisionName = "Esports";
      if (tournamentRow.division_id) {
        const { data: divRow } = await admin
          .from("divisions")
          .select("name")
          .eq("id", tournamentRow.division_id)
          .maybeSingle();
        if (divRow?.name) divisionName = divRow.name;
      }

      const title = buildAchievementTitle(data.placement!, tournamentRow.name);
      const baseSlug = slugify(title);
      const slug = `${baseSlug}-${tournamentId.slice(0, 8)}`;
      const tournamentDate = tournamentRow.end_date ?? new Date().toISOString().slice(0, 10);
      const position = data.placement === 1 ? "Champion" : data.placement === 2 ? "Runner Up" : "3rd Place";

      const { error: achErr } = await admin.from("gallery_entries").insert({
        slug,
        title,
        division: divisionName,
        tournament_date: tournamentDate,
        position,
        status: "Online",
        logo_url: "/brand/logo.jpg",
        preview_images: ["/brand/logo.jpg"],
        description: "Pencapaian luar biasa tim dalam turnamen.",
        organization_id: org.id,
        division_id: tournamentRow.division_id,
        tournament_id: tournamentId,
        placement: data.placement!,
      });
      if (achErr) console.error("completeTournamentAction: achievement insert:", achErr);
      else {
        revalidatePath("/");
        revalidatePath("/gallery");
      }
    }
  }

  await logAudit({
    actorId: user.id,
    action: "tournament.complete",
    entityType: "tournament",
    entityId: tournamentId,
    metadata: { won: data.won, placement: data.placement, prizeEarned: data.prizeEarned },
  });

  revalidatePath(`/${orgSlug}/tournaments`);
  revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  revalidatePath("/manage", "layout");
  revalidatePath("/dashboard/finances");
  revalidatePath("/dashboard/salaries");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// WA Blast for Registration Confirmed
// ---------------------------------------------------------------------------

interface RegistrationNotifData {
  tournamentId: string;
  orgId: string;
  orgSlug: string;
  name: string;
  organizer: string | null;
  startDate: string;
  prizePool: string | null;
}

async function fanOutRegistrationNotification(
  admin: ReturnType<typeof createAdminClient>,
  data: RegistrationNotifData,
) {
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", data.orgId)
    .maybeSingle();
  const orgName = org?.name ?? "Tim";

  const { data: members } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", data.orgId)
    .eq("is_active", true);
  if (!members || members.length === 0) return;

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, phone_wa")
    .in("id", userIds);
  const phoneMap = new Map((profiles ?? []).map((p) => [p.id, p.phone_wa]));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const tournamentUrl = `${appUrl}/${data.orgSlug}/tournaments/${data.tournamentId}`;

  const waMessage = buildTournamentRegisteredWaMessage({
    orgName,
    tournamentName: data.name,
    organizer: data.organizer,
    startDate: data.startDate,
    prizePool: data.prizePool,
    tournamentUrl,
  });

  const title = `Terdaftar: ${data.name}`;
  const body = `${orgName} sudah resmi terdaftar di turnamen ${data.name}.`;

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

  await admin.from("notifications").insert(rows);

  const recipients = members
    .map((m) => ({ phone: phoneMap.get(m.user_id), message: waMessage }))
    .filter((r): r is { phone: string; message: string } => Boolean(r.phone));

  if (recipients.length > 0) {
    blastWaMessage(recipients).catch((err) =>
      console.error("[WA Blast] Registration notification error:", err),
    );
  }
}

// ---------------------------------------------------------------------------
// WA Blast for Tournament Win
// ---------------------------------------------------------------------------

interface WinNotifData {
  tournamentId: string;
  orgId: string;
  orgSlug: string;
  tournamentName: string;
  placement: number;
  prizeAmount: number;
  bonusMap: Map<string, number>; // user_id → bonus_percentage
}

async function fanOutWinNotification(
  admin: ReturnType<typeof createAdminClient>,
  data: WinNotifData,
) {
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", data.orgId)
    .maybeSingle();
  const orgName = org?.name ?? "Tim";

  const { data: members } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", data.orgId)
    .eq("is_active", true);
  if (!members || members.length === 0) return;

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, phone_wa")
    .in("id", userIds);
  const phoneMap = new Map((profiles ?? []).map((p) => [p.id, p.phone_wa]));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const tournamentUrl = `${appUrl}/${data.orgSlug}/tournaments/${data.tournamentId}`;

  const title = `🏆 Juara ${data.placement}: ${data.tournamentName}`;
  const body = `${orgName} meraih Juara ${data.placement} di ${data.tournamentName}! Selamat!`;

  const rows = members.map((m) => {
    const bonusPct = data.bonusMap.get(m.user_id) ?? 0;
    const bonusAmount = bonusPct > 0 ? Math.round((data.prizeAmount * bonusPct) / 100) : 0;
    const phone = phoneMap.get(m.user_id) ?? null;
    const waMessage = phone
      ? buildTournamentWonWaMessage({
          orgName,
          tournamentName: data.tournamentName,
          placement: data.placement,
          prizePool: data.prizeAmount,
          bonusAmount: bonusAmount > 0 ? bonusAmount : null,
          bonusPercentage: bonusPct > 0 ? bonusPct : null,
          tournamentUrl,
        })
      : null;
    return {
      organization_id: data.orgId,
      user_id: m.user_id,
      type: "system" as const,
      title,
      body,
      ref_id: data.tournamentId,
      ref_type: "tournament",
      wa_number: phone,
      wa_message: waMessage,
    };
  });

  await admin.from("notifications").insert(rows);

  const recipients = rows
    .filter((r): r is typeof r & { wa_number: string; wa_message: string } =>
      Boolean(r.wa_number && r.wa_message),
    )
    .map((r) => ({ phone: r.wa_number, message: r.wa_message }));

  if (recipients.length > 0) {
    blastWaMessage(recipients).catch((err) =>
      console.error("[WA Blast] Win notification error:", err),
    );
  }
}

export async function blastTournamentTimelineAction(
  orgSlug: string,
  tournamentId: string,
): Promise<ActionError | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Anda harus login" };

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) return { ok: false, message: "Organisasi tidak ditemukan" };

  const { data: tournament, error: tourError } = await admin
    .from("tournaments")
    .select("id, name, division_id")
    .eq("id", tournamentId)
    .single();

  if (tourError || !tournament) {
    return { ok: false, message: "Turnamen tidak ditemukan" };
  }

  // Fetch stages
  const { data: stages } = await admin
    .from("tournament_stages")
    .select("stage_name, scheduled_at, is_completed")
    .eq("tournament_id", tournamentId)
    .order("scheduled_at", { ascending: true })
    .limit(50);

  // Fetch team members
  const { data: members } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", org.id)
    .eq("division_id", tournament.division_id)
    .eq("is_active", true)
    .limit(500);

  if (!members || members.length === 0) {
    return { ok: false, message: "Tidak ada member aktif di divisi ini" };
  }

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, phone_wa")
    .in("id", userIds);
  const phoneMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.phone_wa]),
  );

  const title = `Timeline: ${tournament.name}`;
  const stagesList = (stages ?? [])
    .map((s) => {
      const date = new Date(s.scheduled_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });
      return `- ${s.stage_name}: ${date}${s.is_completed ? " (Selesai)" : ""}`;
    })
    .join("\n");

  const waMessage = [
    `[${org.name}] Timeline Turnamen: ${tournament.name}`,
    "",
    stagesList || "Belum ada tahapan.",
    "",
    "Persiapkan tim Anda dan cek info selengkapnya di aplikasi.",
  ].join("\n");

  const rows = members.map((m) => ({
    organization_id: org.id,
    user_id: m.user_id,
    type: "system" as const,
    title,
    body: `Timeline Turnamen: ${tournament.name}`,
    ref_id: tournament.id,
    ref_type: "tournament",
    wa_number: phoneMap.get(m.user_id) ?? null,
    wa_message: phoneMap.get(m.user_id) ? waMessage : null,
  }));

  const { error: notifError } = await admin.from("notifications").insert(rows);
  if (notifError) return { ok: false, message: notifError.message };

  await logAudit({
    actorId: user.id,
    action: "tournament.timeline_blast",
    entityType: "tournament",
    entityId: tournamentId,
  });

  const recipients = rows
    .filter((r): r is typeof r & { wa_number: string; wa_message: string } =>
      Boolean(r.wa_number && r.wa_message),
    )
    .map((r) => ({ phone: r.wa_number, message: r.wa_message }));

  if (recipients.length > 0) {
    blastWaMessage(recipients).catch((err) =>
      console.error("[WA Blast] Timeline blast error:", err),
    );
  }

  return { ok: true };
}

