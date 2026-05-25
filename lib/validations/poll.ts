import { z } from "zod";

export const createPollSchema = z.object({
  question: z.string().trim().min(1, "Pertanyaan wajib diisi").max(500),
  options: z
    .array(z.string().trim().min(1))
    .min(2, "Minimal 2 opsi")
    .max(10, "Maksimal 10 opsi"),
  expires_at: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

export const createAvailabilityPollSchema = z.object({
  question: z.string().trim().min(1, "Pertanyaan wajib diisi").max(500),
  availability_slots: z
    .array(z.string().min(1))
    .min(1, "Minimal 1 slot waktu")
    .max(20, "Maksimal 20 slot"),
  expires_at: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreateAvailabilityPollInput = z.infer<typeof createAvailabilityPollSchema>;

export const votePollSchema = z.object({
  poll_id: z.string().uuid(),
  option_index: z.number().int().min(0),
});

export type VotePollInput = z.infer<typeof votePollSchema>;

export const voteAvailabilitySchema = z.object({
  poll_id: z.string().uuid(),
  slot_indices: z.array(z.number().int().min(0)),
});

export type VoteAvailabilityInput = z.infer<typeof voteAvailabilitySchema>;
