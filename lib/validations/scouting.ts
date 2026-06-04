import { z } from "zod";

const roleEntrySchema = z.object({
  nickname: z.string().trim().max(100).optional(),
  heroPool: z.array(z.string()).optional(),
  habit: z.string().trim().max(1000).optional(),
});

export const opponentProfileDataSchema = z.object({
  playstyle: z.string().trim().max(1000).optional(),
  roster: z.object({
    exp_laner:  roleEntrySchema.optional(),
    jungler:    roleEntrySchema.optional(),
    mid_laner:  roleEntrySchema.optional(),
    gold_laner: roleEntrySchema.optional(),
    roamer:     roleEntrySchema.optional(),
  }).optional(),
  // legacy fields — kept for backward compat
  team_name:    z.string().trim().max(200).optional(),
  usernames:    z.array(z.string()).optional(),
  high_rank:    z.string().trim().max(100).optional(),
  current_rank: z.string().trim().max(100).optional(),
  hero_pool:    z.array(z.string()).optional(),
  weaknesses:   z.string().trim().max(1000).optional(),
  notes:        z.string().trim().max(2000).optional(),
});

export const createOpponentProfileSchema = z.object({
  opponent_name: z.string().trim().min(1, "Nama lawan wajib diisi").max(200),
  data: opponentProfileDataSchema.optional(),
});

export type CreateOpponentProfileInput = z.infer<typeof createOpponentProfileSchema>;

export const updateOpponentProfileSchema = z.object({
  profile_id: z.string().uuid(),
  opponent_name: z.string().trim().min(1, "Nama lawan wajib diisi").max(200),
  data: opponentProfileDataSchema.optional(),
});

export type UpdateOpponentProfileInput = z.infer<typeof updateOpponentProfileSchema>;
