import { z } from "zod";

export const visibilitySchema = z.enum(["public", "division", "private"]);

export const createStrategyNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  content: z
    .string()
    .trim()
    .min(1, "Isi catatan wajib diisi")
    .max(20000, "Isi catatan maksimal 20000 karakter"),
  division_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((v) => v ?? null),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [],
    ),
  visibility: visibilitySchema.default("division"),
});

export type CreateStrategyNoteInput = z.infer<typeof createStrategyNoteSchema>;

export const updateStrategyNoteSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  content: z
    .string()
    .trim()
    .min(1, "Isi catatan wajib diisi")
    .max(20000, "Isi catatan maksimal 20000 karakter"),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [],
    ),
  visibility: visibilitySchema.default("division"),
});

export type UpdateStrategyNoteInput = z.infer<typeof updateStrategyNoteSchema>;
