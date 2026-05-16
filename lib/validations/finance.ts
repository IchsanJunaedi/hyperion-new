import { z } from "zod";

export const financeTypeSchema = z.enum(["income", "expense"]);

export const INCOME_CATEGORIES = [
  "Saldo Awal",
  "Iuran Member",
  "Prize Money",
  "Sponsor",
  "Donasi",
  "Lainnya",
] as const;

export const EXPENSE_CATEGORIES = [
  "Daftar Turnamen",
  "Jersey",
  "Bootcamp",
  "Peralatan",
  "Operasional",
  "Lainnya",
] as const;

export const createFinanceSchema = z.object({
  type: financeTypeSchema,
  amount: z.coerce
    .number({ error: "Jumlah harus angka" })
    .int("Jumlah harus bilangan bulat")
    .positive("Jumlah harus lebih dari 0"),
  category: z.string().min(1, "Kategori wajib diisi").max(100),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  date: z
    .string()
    .min(1, "Tanggal wajib diisi")
    .refine((d) => !Number.isNaN(new Date(d).getTime()), "Tanggal tidak valid"),
});

export type CreateFinanceInput = z.infer<typeof createFinanceSchema>;
