import { z } from "zod";

export const createContractSchema = z.object({
  user_id: z.string().uuid("Pilih member"),
  monthly_salary: z.coerce
    .number({ error: "Nominal harus angka" })
    .int("Nominal harus bilangan bulat")
    .positive("Nominal harus lebih dari 0"),
  bonus_percentage: z.coerce
    .number({ error: "Persentase harus angka" })
    .min(0, "Minimal 0")
    .max(100, "Maksimal 100")
    .default(0),
  start_date: z.string().min(1, "Tanggal mulai wajib diisi"),
  end_date: z.string().optional().transform((v) => (v && v.length > 0 ? v : null)),
  notes: z.string().trim().max(500).optional().transform((v) => (v && v.length > 0 ? v : null)),
});

export const updateContractSchema = createContractSchema.extend({
  contract_id: z.string().uuid(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
