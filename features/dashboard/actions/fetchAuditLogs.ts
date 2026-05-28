"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ACTION_LABELS } from "../constants";

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
    .select("id, action, actor_id, entity_type, entity_id, metadata, created_at", { count: "exact" })
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

  // Fetch only actor_id (single narrow column), ordered so duplicates are
  // adjacent. A limit of 200 is enough to cover all realistic distinct actors
  // in a team org — audit_logs can have thousands of rows but the number of
  // unique actors is always small. JS Set dedup then resolves any duplicates
  // within the 200-row window before the profiles lookup.
  const { data: logs } = await admin
    .from("audit_logs")
    .select("actor_id")
    .not("actor_id", "is", null)
    .order("actor_id", { ascending: true })
    .limit(200);

  const actorIds = [
    ...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean)),
  ] as string[];
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
