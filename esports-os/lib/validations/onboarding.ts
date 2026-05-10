import { z } from "zod";

import { slugSchema } from "@/lib/validations/shared";

export const profileSetupSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9_]{3,24}$/,
      "Username harus 3–24 karakter, hanya huruf kecil, angka, dan _",
    ),
  bio: z
    .string()
    .trim()
    .max(280, "Bio maksimal 280 karakter")
    .optional()
    .or(z.literal("")),
  game_ids: z
    .object({
      mlbb: z.string().trim().max(60).optional().or(z.literal("")),
      mlbb_server: z.string().trim().max(20).optional().or(z.literal("")),
      valorant: z.string().trim().max(60).optional().or(z.literal("")),
      pubg: z.string().trim().max(60).optional().or(z.literal("")),
      ff: z.string().trim().max(60).optional().or(z.literal("")),
    })
    .partial(),
});
export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

export const orgTierEnum = z.enum(["pelajar", "komunitas", "pro"]);
export type OrgTier = z.infer<typeof orgTierEnum>;

export const supportedGameEnum = z.enum([
  "mobile_legends",
  "valorant",
  "pubg_mobile",
  "free_fire",
  "dota_2",
  "cs2",
]);
export type SupportedGame = z.infer<typeof supportedGameEnum>;

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama tim minimal 2 karakter")
    .max(80, "Nama tim maksimal 80 karakter"),
  slug: slugSchema,
  tier: orgTierEnum,
  divisions: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(60),
        game: supportedGameEnum,
      }),
    )
    .min(1, "Minimal 1 divisi")
    .max(10, "Maksimal 10 divisi saat onboarding"),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
