import { z } from "zod";

export const matchFormatSchema = z.enum(["bo1", "bo3", "bo5", "scrimmage"]);

export const attendanceStatusSchema = z.enum([
  "confirmed",
  "declined",
  "tentative",
  "pending",
]);

/**
 * Schema for creating a scrim. `scheduled_at` is a local-time ISO string
 * coming from a datetime-local input; we normalize it to a UTC ISO string
 * before insert.
 */
export const createScrimSchema = z.object({
  division_id: z.string().uuid("Divisi wajib dipilih"),
  opponent_name: z
    .string()
    .trim()
    .min(1, "Nama lawan wajib diisi")
    .max(120, "Nama lawan maksimal 120 karakter"),
  opponent_contact: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  scheduled_at: z
    .string()
    .min(1, "Jadwal wajib diisi")
    .refine((iso) => !Number.isNaN(new Date(iso).getTime()), "Jadwal tidak valid")
    .refine(
      (iso) => new Date(iso).getTime() > Date.now() - 60_000,
      "Jadwal harus di masa depan",
    ),
  format: matchFormatSchema,
  server_region: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  room_info: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreateScrimInput = z.infer<typeof createScrimSchema>;

export const updateAttendanceSchema = z.object({
  scrim_id: z.string().uuid(),
  status: attendanceStatusSchema,
  note: z
    .string()
    .trim()
    .max(280)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;

export const submitResultSchema = z
  .object({
    scrim_id: z.string().uuid(),
    our_score: z.coerce.number().int().min(0).max(999),
    opponent_score: z.coerce.number().int().min(0).max(999),
    notes: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    performance_rating: z.coerce
      .number()
      .int()
      .min(1, "Rating 1–5")
      .max(5, "Rating 1–5")
      .optional()
      .nullable(),
  })
  .transform((data) => ({
    ...data,
    is_win:
      data.our_score === data.opponent_score
        ? null
        : data.our_score > data.opponent_score,
  }));

export type SubmitResultInput = z.infer<typeof submitResultSchema>;

export const cancelScrimSchema = z.object({
  scrim_id: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const updateScrimSchema = z.object({
  scrim_id: z.string().uuid(),
  division_id: z.string().uuid("Divisi wajib dipilih"),
  opponent_name: z
    .string()
    .trim()
    .min(1, "Nama lawan wajib diisi")
    .max(120, "Nama lawan maksimal 120 karakter"),
  opponent_contact: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  scheduled_at: z
    .string()
    .min(1, "Jadwal wajib diisi")
    .refine((iso) => !Number.isNaN(new Date(iso).getTime()), "Jadwal tidak valid"),
  format: matchFormatSchema,
  server_region: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  room_info: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type UpdateScrimInput = z.infer<typeof updateScrimSchema>;
