import { z } from "zod";

export const eventTypeSchema = z.enum([
  "scrim",
  "tournament",
  "practice",
  "meeting",
  "other",
]);

export const createCalendarEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  event_type: eventTypeSchema,
  division_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  starts_at: z
    .string()
    .min(1, "Waktu mulai wajib diisi")
    .refine((iso) => !Number.isNaN(new Date(iso).getTime()), "Waktu tidak valid"),
  ends_at: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  is_all_day: z.coerce.boolean().default(false),
  location: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
