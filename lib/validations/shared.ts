import { z } from "zod";

/**
 * WhatsApp number. Accepts Indonesian format (0812xxx, +6281xxx, 6281xxx)
 * or any international number. Normalized to digits only for storage.
 */
export const waNumberSchema = z
  .string()
  .trim()
  .min(8, "Nomor WhatsApp terlalu pendek")
  .max(15, "Nomor WhatsApp maksimal 15 karakter")
  .regex(/^[0-9+\s-]+$/, "Nomor WhatsApp hanya boleh angka, +, spasi, dan -")
  .transform((raw) => {
    const digits = raw.replace(/[\s-]/g, "");
    if (digits.startsWith("+62")) return digits.slice(1);
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    return digits;
  });

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter")
  .refine((val) => /[A-Z]/.test(val), "Password harus mengandung huruf kapital")
  .refine((val) => /[0-9]/.test(val), "Password harus mengandung angka")
  .refine(
    (val) => /[.!@#]/.test(val),
    "Password harus mengandung karakter spesial (. ! @ #)",
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Format email tidak valid");

/** Slug rule mirrors `lib/utils/slug.ts > SLUG_RE`. */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/,
    "Slug harus 3–32 karakter, hanya huruf kecil, angka, dan tanda hubung; tidak boleh diawali/diakhiri tanda hubung",
  );
