import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Log an action to the audit trail. Must be awaited in server actions
 * otherwise Next.js may cut off the request before insert completes.
 */
export async function logAudit(params: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: (params.metadata ?? {}) as unknown as import("@/types/database").Json,
    });
  } catch (err) {
    // Non-blocking: audit failure shouldn't break the main action
    console.error("Audit log failed:", err);
  }
}
