import { z } from "zod";

/**
 * Indonesian WhatsApp number. Accepts the three forms users actually
 * type: leading `+62`, leading `62`, or local `0`. We always normalize
 * to E.164-ish `628…` for storage so Fonnte / Supabase Auth see a
 * consistent value.
 */
export const waNumberSchema = z
  .string()
  .trim()
  .min(8, "Nomor WhatsApp terlalu pendek")
  .max(20, "Nomor WhatsApp terlalu panjang")
  .refine(
    (raw) => /^(?:\+?62|0)8[1-9][0-9]{6,11}$/.test(raw.replace(/[\s-]/g, "")),
    "Nomor WhatsApp tidak valid (gunakan format Indonesia, mis. 0812xxx atau +6281xxx)",
  )
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
  .refine(
    (val) => /[a-zA-Z]/.test(val) && /[0-9]/.test(val),
    "Password harus mengandung huruf dan angka",
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
