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

export const votePollSchema = z.object({
  poll_id: z.string().uuid(),
  option_index: z.number().int().min(0),
});

export type VotePollInput = z.infer<typeof votePollSchema>;
