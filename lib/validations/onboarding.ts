import { z } from "zod";

import { slugSchema } from "@/lib/validations/shared";

/**
 * Profile setup schema — used during onboarding.
 * All members must fill: full name, nickname/username, date of birth, WA number.
 * Social links are optional.
 */
export const profileSetupSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9_]{3,24}$/,
      "Nickname harus 3–24 karakter, hanya huruf kecil, angka, dan _",
    ),
  date_of_birth: z
    .string()
    .min(1, "Tanggal lahir wajib diisi")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Tanggal tidak valid"),
  phone_wa: z
    .string()
    .trim()
    .min(10, "Nomor WA minimal 10 digit")
    .max(15, "Nomor WA maksimal 15 digit")
    .regex(/^[0-9+]+$/, "Nomor WA hanya boleh angka dan +"),
  bio: z
    .string()
    .trim()
    .max(280, "Bio maksimal 280 karakter")
    .optional()
    .or(z.literal("")),
  social_links: z
    .object({
      instagram: z.string().trim().max(200).optional().or(z.literal("")),
      twitter: z.string().trim().max(200).optional().or(z.literal("")),
      tiktok: z.string().trim().max(200).optional().or(z.literal("")),
      youtube: z.string().trim().max(200).optional().or(z.literal("")),
      discord: z.string().trim().max(100).optional().or(z.literal("")),
    })
    .partial()
    .optional(),
  game_ids: z
    .object({
      mlbb: z.string().trim().max(60).optional().or(z.literal("")),
      mlbb_server: z.string().trim().max(20).optional().or(z.literal("")),
      valorant: z.string().trim().max(60).optional().or(z.literal("")),
      pubg: z.string().trim().max(60).optional().or(z.literal("")),
      ff: z.string().trim().max(60).optional().or(z.literal("")),
    })
    .partial()
    .optional(),
});
export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;

// Keep these for backward compat with existing org creation code (will be removed later)
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
