import { z } from "zod";

export const createPlayerTargetSchema = z.object({
  user_id: z.string().uuid("Player wajib dipilih"),
  skill_name: z.string().trim().min(1, "Nama skill wajib diisi").max(100),
  target_level: z.coerce.number().int().min(1).max(10),
  current_level: z.coerce.number().int().min(1).max(10).default(1),
  notes: z.string().trim().max(500).optional().transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreatePlayerTargetInput = z.infer<typeof createPlayerTargetSchema>;

export const updatePlayerTargetSchema = z.object({
  target_id: z.string().uuid(),
  current_level: z.coerce.number().int().min(1).max(10),
  notes: z.string().trim().max(500).optional().transform((v) => (v && v.length > 0 ? v : null)),
});

export type UpdatePlayerTargetInput = z.infer<typeof updatePlayerTargetSchema>;
