import { z } from "zod";

export const createScrimRequestSchema = z.object({
  to_org_id: z.string().uuid("Tim lawan wajib dipilih"),
  division_id: z.string().uuid("Divisi wajib dipilih"),
  message: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  preferred_time: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  format: z.enum(["bo1", "bo3", "bo5", "scrimmage"]).default("bo3"),
});

export type CreateScrimRequestInput = z.infer<typeof createScrimRequestSchema>;

export const respondScrimRequestSchema = z.object({
  request_id: z.string().uuid(),
  status: z.enum(["accepted", "declined"]),
});

export type RespondScrimRequestInput = z.infer<typeof respondScrimRequestSchema>;
