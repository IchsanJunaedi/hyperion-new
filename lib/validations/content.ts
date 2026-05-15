import { z } from "zod";

export const contentPlatformSchema = z.enum(["ig", "tiktok", "x"]);
export const contentStatusSchema = z.enum(["draft", "scheduled", "approved", "published"]);

export const PLATFORM_LABELS: Record<string, string> = {
  ig: "Instagram",
  tiktok: "TikTok",
  x: "X / Twitter",
};

export const createContentSchema = z.object({
  platform: contentPlatformSchema,
  title: z.string().trim().min(1, "Judul wajib diisi").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  scheduled_at: z
    .string()
    .min(1, "Waktu wajib diisi")
    .refine((d) => !Number.isNaN(new Date(d).getTime()), "Waktu tidak valid"),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
