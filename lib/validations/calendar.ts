import { z } from "zod";

export const eventTypeSchema = z.enum([
  "scrim",
  "tournament",
  "practice",
  "meeting",
  "bootcamp",
  "other",
]);

export const eventStatusSchema = z.enum([
  "draft",
  "confirmed",
  "ongoing",
  "completed",
  "cancelled",
]);

export const eventPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

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
    .refine(
      (iso) => !Number.isNaN(new Date(iso).getTime()),
      "Waktu tidak valid",
    ),
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
  visibility: z.enum(["private", "management", "coach_up", "all"]).default("all"),
}).refine(
  (data) => {
    if (!data.ends_at) return true; // ends_at opsional, tidak divalidasi
    return new Date(data.ends_at) >= new Date(data.starts_at);
  },
  {
    message: "Waktu selesai tidak boleh sebelum waktu mulai",
    path: ["ends_at"],
  },
);

export const updateCalendarEventSchema = z.object({
  id: z.string().uuid("Event ID harus valid UUID"),
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter")
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  event_type: eventTypeSchema.optional(),
  starts_at: z
    .string()
    .refine(
      (iso) => !Number.isNaN(new Date(iso).getTime()),
      "Waktu tidak valid",
    )
    .optional(),
  ends_at: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  is_all_day: z.coerce.boolean().optional(),
  location: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  area: z.string().trim().max(100).optional().nullable(),
  platform: z.string().trim().max(100).optional().nullable(),
  status: eventStatusSchema.optional(),
  priority: eventPrioritySchema.optional(),
  pic_user_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  tags: z.string().array().optional(),
  visual_needed: z.coerce.boolean().optional(),
  content: z.unknown().optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
  visibility: z.enum(["private", "management", "coach_up", "all"]).optional(),
}).refine(
  (data) => {
    if (!data.starts_at || !data.ends_at) return true; // keduanya opsional di update
    return new Date(data.ends_at) >= new Date(data.starts_at);
  },
  {
    message: "Waktu selesai tidak boleh sebelum waktu mulai",
    path: ["ends_at"],
  },
);

export const updateEventPropertySchema = z.object({
  id: z.string().uuid(),
  field: z.enum([
    "title",
    "status",
    "priority",
    "area",
    "platform",
    "pic_user_id",
    "tags",
    "visual_needed",
    "content",
  ]),
  value: z.unknown(),
});

export const recurringRuleSchema = z.object({
  freq: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().min(1).default(1),
  byday: z.string().array().optional(),
  count: z.number().min(1).optional(),
  ends_at: z.string().optional(),
});

export type CreateCalendarEventInput = z.infer<
  typeof createCalendarEventSchema
>;
export type UpdateCalendarEventInput = z.infer<
  typeof updateCalendarEventSchema
>;
export type UpdateEventPropertyInput = z.infer<
  typeof updateEventPropertySchema
>;
export type RecurringRuleInput = z.infer<typeof recurringRuleSchema>;
