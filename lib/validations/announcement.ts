import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  body: z
    .string()
    .trim()
    .min(1, "Isi pengumuman wajib diisi")
    .max(5000, "Isi pengumuman maksimal 5000 karakter"),
  division_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  is_pinned: z.coerce.boolean().default(false),
  send_wa_blast: z.coerce.boolean().default(false),
  requires_ack: z.coerce.boolean().default(false),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  body: z
    .string()
    .trim()
    .min(1, "Isi pengumuman wajib diisi")
    .max(5000, "Isi pengumuman maksimal 5000 karakter"),
  is_pinned: z.coerce.boolean().default(false),
});

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
