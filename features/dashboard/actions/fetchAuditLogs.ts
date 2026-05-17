"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const ACTION_LABELS: Record<string, string> = {
  // Org / Team
  org_updated: "Tim diupdate",
  org_deleted: "Tim dihapus",
  team_created: "Tim dibuat",
  // Divisions
  division_created: "Divisi dibuat",
  division_renamed: "Divisi diubah nama",
  division_archived: "Divisi diarsipkan",
  division_deleted: "Divisi dihapus",
  // Members
  member_removed: "Member dihapus",
  member_added: "Member ditambahkan",
  member_kicked: "Member dikick",
  member_left: "Member keluar",
  member_joined: "Member bergabung",
  // Auth
  user_registered: "User mendaftar",
  // Role
  role_changed: "Role diubah",
  // Announcements
  "announcement.create": "Pengumuman dibuat",
  "announcement.update": "Pengumuman diupdate",
  "announcement.delete": "Pengumuman dihapus",
  // Strategy
  "strategy.create": "Catatan strategi dibuat",
  "strategy.update": "Catatan strategi diupdate",
  "strategy.delete": "Catatan strategi dihapus",
  // Files
  "file.upload": "File diupload",
  "file.delete": "File dihapus",
  // Finances
  "finance.create": "Keuangan dicatat",
  "finance.delete": "Keuangan dihapus",
  // Content Calendar
  "content.create": "Konten dibuat",
  "content.update": "Konten diupdate",
  "content.delete": "Konten dihapus",
  "content.status_change": "Status konten diubah",
  // Scrim
  "scrim.create": "Scrim dibuat",
  "scrim.update": "Scrim diupdate",
  "scrim.delete": "Scrim dihapus",
  "scrim.cancel": "Scrim dibatalkan",
  // Matchmaking
  "scrim_request.create": "Request scrim dikirim",
  "scrim_request.accepted": "Request scrim diterima",
  "scrim_request.declined": "Request scrim ditolak",
  // Player Development
  "player_target.create": "Target pemain dibuat",
  "player_target.update": "Target pemain diupdate",
  "player_target.delete": "Target pemain dihapus",
  // Scouting
  "opponent_profile.create": "Profil lawan dibuat",
  "opponent_profile.update": "Profil lawan diupdate",
  // Tournaments
  "tournament.create": "Turnamen dibuat",
  "tournament.update": "Turnamen diupdate",
  "tournament.delete": "Turnamen dihapus",
  "tournament.status.upcoming": "Turnamen status: upcoming",
  "tournament.status.ongoing": "Turnamen status: ongoing",
  "tournament.status.completed": "Turnamen selesai",
  "tournament.status.cancelled": "Turnamen dibatalkan",
  // Polls
  "poll.create": "Polling dibuat",
  // Calendar
  "create-event": "Event kalender dibuat",
  "update-event": "Event kalender diupdate",
  "update-permissions": "Izin kalender diupdate",
  "update-visibility": "Visibilitas kalender diupdate",
  // Notifications
  "wa.retry": "WA dikirim ulang",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  organization: "Tim / Org",
  division: "Divisi",
  team_member: "Member",
  announcement: "Pengumuman",
  strategy_note: "Strategi",
  file: "File",
  finance: "Keuangan",
  content_calendar: "Konten",
  scrim: "Scrim",
  scrim_request: "Request Scrim",
  player_target: "Target Pemain",
  opponent_profile: "Profil Lawan",
  tournament: "Turnamen",
  poll: "Polling",
  calendar_event: "Event Kalender",
  notification: "Notifikasi",
};

export type AuditLogItem = {
  id: string;
  action: string;
  actionLabel: string;
  actorName: string;
  actorId: string | null;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  time: string;
  rawTime: string;
};

const PAGE_SIZE = 50;

export async function fetchAuditLogs(params: {
  search?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
}): Promise<{ items: AuditLogItem[]; total: number; pageCount: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();
  const page = params.page ?? 1;
  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = page * PAGE_SIZE - 1;

  let query = admin
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (params.search) {
    query = query.ilike("action", `%${params.search}%`);
  }
  if (params.entityType) {
    query = query.eq("entity_type", params.entityType);
  }
  if (params.actorId) {
    query = query.eq("actor_id", params.actorId);
  }
  if (params.from) {
    query = query.gte("created_at", new Date(params.from).toISOString());
  }
  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte("created_at", toDate.toISOString());
  }

  const { data: logs, count } = await query;

  const actorIds = [
    ...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean)),
  ] as string[];

  const { data: profiles } =
    actorIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, display_name, username")
          .in("id", actorIds)
      : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const items: AuditLogItem[] = (logs ?? []).map((log) => {
    const actor = log.actor_id ? profileMap.get(log.actor_id) : null;
    const meta = (log.metadata as Record<string, unknown>) ?? {};
    return {
      id: log.id,
      action: log.action,
      actionLabel: ACTION_LABELS[log.action] ?? log.action,
      actorName: actor?.display_name ?? actor?.username ?? "System",
      actorId: log.actor_id,
      entityType: log.entity_type,
      entityId: log.entity_id,
      metadata: meta,
      time: new Date(log.created_at).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
      rawTime: log.created_at,
    };
  });

  const total = count ?? 0;
  return { items, total, pageCount: Math.ceil(total / PAGE_SIZE) };
}

export async function fetchDistinctActors(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();
  const { data: logs } = await admin
    .from("audit_logs")
    .select("actor_id")
    .not("actor_id", "is", null)
    .limit(1000);

  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))] as string[];
  if (actorIds.length === 0) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, username")
    .in("id", actorIds);

  return (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.display_name ?? p.username ?? p.id,
  }));
}
