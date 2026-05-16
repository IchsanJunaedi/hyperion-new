import { z } from "zod";

import {
  emailSchema,
  passwordSchema,
  waNumberSchema,
} from "@/lib/validations/shared";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama maksimal 80 karakter"),
  email: emailSchema,
  password: passwordSchema,
  phone_wa: waNumberSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
