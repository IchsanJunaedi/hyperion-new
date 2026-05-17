"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ACTION_LABELS } from "./fetchAuditLogs";

export type ExportRow = {
  timestamp: string;
  actor: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityId: string;
  metadata: string;
};

export async function exportAuditLogs(params: {
  search?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
}): Promise<{ rows: ExportRow[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();

  let query = admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);

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

  const { data: logs } = await query;

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

  const rows: ExportRow[] = (logs ?? []).map((log) => {
    const actor = log.actor_id ? profileMap.get(log.actor_id) : null;
    const meta = (log.metadata as Record<string, unknown>) ?? {};
    return {
      timestamp: new Date(log.created_at).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      }),
      actor: actor?.display_name ?? actor?.username ?? "System",
      action: log.action,
      actionLabel: ACTION_LABELS[log.action] ?? log.action,
      entityType: log.entity_type ?? "",
      entityId: log.entity_id ?? "",
      metadata: JSON.stringify(meta),
    };
  });

  return { rows };
}
