"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { createContractSchema, updateContractSchema } from "@/lib/validations/salary";

interface ActionError {
  ok: false;
  message: string;
}

async function verifyManagerOrOwner(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ownerEmail = process.env.OWNER_EMAIL;
  if (ownerEmail && user.email === ownerEmail) return user;

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

function revalidate(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function createContractAction(
  orgId: string,
  raw: unknown,
  paths: string[],
): Promise<ActionError | { ok: true }> {
  const parsed = createContractSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: z.flattenError(parsed.error).formErrors[0] ?? "Form tidak valid" };
  }

  const user = await verifyManagerOrOwner(orgId);
  if (!user) return { ok: false, message: "Akses ditolak." };

  const admin = createAdminClient();
  const { error } = await admin.from("player_contracts").insert({
    organization_id: orgId,
    user_id: parsed.data.user_id,
    monthly_salary: parsed.data.monthly_salary,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date ?? null,
    notes: parsed.data.notes ?? null,
    created_by: user.id,
  });

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "salary_contract.create",
    entityType: "player_contract",
    metadata: { orgId, monthly_salary: parsed.data.monthly_salary },
  });

  revalidate(paths);
  return { ok: true };
}

export async function updateContractAction(
  orgId: string,
  raw: unknown,
  paths: string[],
): Promise<ActionError | { ok: true }> {
  const parsed = updateContractSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: z.flattenError(parsed.error).formErrors[0] ?? "Form tidak valid" };
  }

  const user = await verifyManagerOrOwner(orgId);
  if (!user) return { ok: false, message: "Akses ditolak." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("player_contracts")
    .update({
      user_id: parsed.data.user_id,
      monthly_salary: parsed.data.monthly_salary,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date ?? null,
      notes: parsed.data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.contract_id)
    .eq("organization_id", orgId);

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "salary_contract.update",
    entityType: "player_contract",
    entityId: parsed.data.contract_id,
  });

  revalidate(paths);
  return { ok: true };
}

export async function terminateContractAction(
  orgId: string,
  contractId: string,
  paths: string[],
): Promise<ActionError | { ok: true }> {
  const user = await verifyManagerOrOwner(orgId);
  if (!user) return { ok: false, message: "Akses ditolak." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("player_contracts")
    .update({ status: "terminated", updated_at: new Date().toISOString() })
    .eq("id", contractId)
    .eq("organization_id", orgId);

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "salary_contract.terminate",
    entityType: "player_contract",
    entityId: contractId,
  });

  revalidate(paths);
  return { ok: true };
}

export async function markPaymentPaidAction(
  orgId: string,
  contractId: string,
  payPeriod: string,
  amount: number,
  paths: string[],
  bonusAmount?: number,
  bonusNote?: string | null,
): Promise<ActionError | { ok: true }> {
  const user = await verifyManagerOrOwner(orgId);
  if (!user) return { ok: false, message: "Akses ditolak." };

  const totalAmount = amount + (bonusAmount ?? 0);
  const notes = bonusNote ?? null;

  const admin = createAdminClient();
  const { error } = await admin.from("salary_payments").upsert(
    {
      contract_id: contractId,
      organization_id: orgId,
      pay_period: payPeriod,
      amount: totalAmount,
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_by: user.id,
      notes,
    },
    { onConflict: "contract_id,pay_period" },
  );

  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    action: "salary_payment.mark_paid",
    entityType: "salary_payment",
    metadata: { contractId, payPeriod, amount: totalAmount, bonusAmount: bonusAmount ?? 0 },
  });

  revalidate(paths);
  return { ok: true };
}
