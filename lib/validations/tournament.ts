import { z } from "zod";

export const createTournamentSchema = z.object({
  division_id: z.string().uuid("Divisi wajib dipilih"),
  name: z.string().trim().min(1, "Nama turnamen wajib diisi").max(200),
  organizer: z.string().trim().max(200).optional().transform((v) => (v && v.length > 0 ? v : null)),
  start_date: z.string().min(1, "Tanggal mulai wajib diisi"),
  end_date: z.string().optional().transform((v) => (v && v.length > 0 ? v : null)),
  prize_pool: z.string().trim().max(100).optional().transform((v) => (v && v.length > 0 ? v : null)),
  registration_fee: z.string().trim().max(100).optional().transform((v) => (v && v.length > 0 ? v : null)),
  registration_url: z.string().trim().max(500).optional().transform((v) => (v && v.length > 0 ? v : null)),
  notes: z.string().trim().max(2000).optional().transform((v) => (v && v.length > 0 ? v : null)),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Format jam tidak valid").optional().transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

export const updateTournamentSchema = createTournamentSchema.extend({
  tournament_id: z.string().uuid(),
});

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;

export const createTournamentStageSchema = z.object({
  tournament_id: z.string().uuid(),
  stage_name: z.string().trim().min(1, "Nama tahap wajib diisi").max(200),
  scheduled_at: z.string().min(1, "Jadwal wajib diisi"),
  notes: z.string().trim().max(500).optional().transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreateTournamentStageInput = z.infer<typeof createTournamentStageSchema>;
