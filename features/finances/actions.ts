"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createFinanceSchema } from "@/lib/validations/finance";
import { logAudit } from "@/lib/audit";

export interface FinanceActionError {
  ok: false;
  message: string;
}

async function verifyManagerOrOwner(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("role", ["manager", "owner"])
    .maybeSingle();

  return membership ? user : null;
}

export async function createFinanceAction(
  orgId: string,
  raw: unknown,
  revalidatePaths: string[],
): Promise<FinanceActionError | { ok: true }> {
  const parsed = createFinanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Form belum lengkap atau tidak valid." };
  }

  const user = await verifyManagerOrOwner(orgId);
  if (!user) return { ok: false, message: "Akses ditolak." };

  const admin = createAdminClient();
  const { error } = await admin.from("finances").insert({
    organization_id: orgId,
    type: parsed.data.type,
    amount: parsed.data.amount,
    category: parsed.data.category,
    description: parsed.data.description ?? null,
    date: parsed.data.date,
    created_by: user.id,
  });

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "finance.create",
    entityType: "finance",
    metadata: {
      type: parsed.data.type,
      amount: parsed.data.amount,
      category: parsed.data.category,
    },
  });

  for (const p of revalidatePaths) revalidatePath(p);
  return { ok: true };
}

export async function deleteFinanceAction(
  financeId: string,
  orgId: string,
  revalidatePaths: string[],
): Promise<FinanceActionError | { ok: true }> {
  const user = await verifyManagerOrOwner(orgId);
  if (!user) return { ok: false, message: "Akses ditolak." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("finances")
    .delete()
    .eq("id", financeId)
    .eq("organization_id", orgId);

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "finance.delete",
    entityType: "finance",
    entityId: financeId,
  });

  for (const p of revalidatePaths) revalidatePath(p);
  return { ok: true };
}
