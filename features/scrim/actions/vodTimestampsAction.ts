"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface VodTimestampRow {
  id: string;
  scrim_id: string;
  game_number: number;
  timestamp_secs: number;
  tagged_player_id: string | null;
  note: string;
  created_by: string;
  created_at: string;
  tagged_player_name: string | null;
}

export async function addVodTimestampAction(
  scrimId: string,
  gameNumber: number,
  timestampSecs: number,
  taggedPlayerId: string | null,
  note: string,
): Promise<{ ok: true; timestamp: VodTimestampRow } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Tidak terautentikasi" };

  const admin = createAdminClient();

  // Verify scrim exists and get org
  const { data: scrim } = await admin
    .from("scrims")
    .select("organization_id")
    .eq("id", scrimId)
    .maybeSingle();
  if (!scrim) return { ok: false, message: "Scrim tidak ditemukan" };

  const isOwner = user.email === process.env.OWNER_EMAIL;

  if (!isOwner) {
    const { data: member } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", scrim.organization_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!member || !["manager", "coach", "captain"].includes(member.role)) {
      return { ok: false, message: "Hanya Manager, Coach, dan Captain yang bisa menambah timestamp" };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = await (admin as any)
    .from("scrim_vod_timestamps")
    .insert({
      scrim_id: scrimId,
      game_number: gameNumber,
      timestamp_secs: timestampSecs,
      tagged_player_id: taggedPlayerId ?? null,
      note,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !inserted) {
    return { ok: false, message: "Gagal menyimpan timestamp" };
  }

  // Fetch tagged player name
  let taggedPlayerName: string | null = null;
  if (taggedPlayerId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", taggedPlayerId)
      .maybeSingle();
    taggedPlayerName = profile?.display_name ?? null;
  }

  const row = inserted as Record<string, unknown>;
  return {
    ok: true,
    timestamp: {
      id: row.id as string,
      scrim_id: row.scrim_id as string,
      game_number: row.game_number as number,
      timestamp_secs: row.timestamp_secs as number,
      tagged_player_id: row.tagged_player_id as string | null,
      note: row.note as string,
      created_by: row.created_by as string,
      created_at: row.created_at as string,
      tagged_player_name: taggedPlayerName,
    },
  };
}

export async function deleteVodTimestampAction(
  timestampId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Tidak terautentikasi" };

  const admin = createAdminClient();

  // Fetch the timestamp to check ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ts } = await (admin as any)
    .from("scrim_vod_timestamps")
    .select("created_by, scrim_id")
    .eq("id", timestampId)
    .maybeSingle();

  if (!ts) return { ok: false, message: "Timestamp tidak ditemukan" };

  const tsRow = ts as Record<string, unknown>;

  // Check if user is creator, owner, or coach/manager
  const isOwner = user.email === process.env.OWNER_EMAIL;
  if (!isOwner && tsRow.created_by !== user.id) {
    const { data: scrim } = await admin
      .from("scrims")
      .select("organization_id")
      .eq("id", tsRow.scrim_id as string)
      .maybeSingle();

    if (!scrim) return { ok: false, message: "Scrim tidak ditemukan" };

    const { data: member } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", scrim.organization_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!member || !["manager", "coach"].includes(member.role)) {
      return { ok: false, message: "Tidak punya izin menghapus timestamp ini" };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("scrim_vod_timestamps")
    .delete()
    .eq("id", timestampId);

  if (error) return { ok: false, message: "Gagal menghapus timestamp" };
  return { ok: true };
}
