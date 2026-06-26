import { z } from "zod";

export const matchFormatSchema = z.enum(["bo1", "bo2", "bo3", "bo5", "bo7", "4match"]);

export const attendanceStatusSchema = z.enum([
  "confirmed",
  "declined",
  "tentative",
  "pending",
]);

/**
 * Schema for creating a scrim. `scheduled_at` is a local-time ISO string
 * coming from a datetime-local input (WIB, no timezone suffix). The server
 * action appends '+07:00' before constructing a UTC Date for storage.
 * Past dates are allowed so that historical scrims can be recorded.
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
  patch: z
    .string()
    .trim()
    .max(30)
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

export const submitResultSchema = z.object({
  scrim_id: z.string().uuid(),
  our_score: z.coerce.number().int().min(0).max(5),
  opponent_score: z.coerce.number().int().min(0).max(5),
  is_win: z.boolean().nullable().optional(),
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
  result_image_path: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

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
  patch: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type UpdateScrimInput = z.infer<typeof updateScrimSchema>;
