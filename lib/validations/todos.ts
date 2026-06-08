import { z } from "zod";

export const createManualTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  due_date: z
    .string()
    .refine(
      (iso) => iso === "" || !Number.isNaN(new Date(iso).getTime()),
      "Tanggal tidak valid",
    )
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assigned_to: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((v) => v ?? null),
});

export type CreateManualTodoInput = z.infer<typeof createManualTodoSchema>;

export const dismissSmartTodoSchema = z.object({
  smart_type: z.enum([
    "contract_expiry",
    "salary_due",
    "member_unassigned",
    "trial_pending",
    "scrim_no_result",
    "sponsor_stale",
    "tournament_no_bracket",
  ]),
  entity_id: z.string(),
});

export type DismissSmartTodoInput = z.infer<typeof dismissSmartTodoSchema>;
