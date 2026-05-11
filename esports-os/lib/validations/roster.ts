import { z } from "zod";

import { emailSchema, waNumberSchema } from "@/lib/validations/shared";

/**
 * Validation for all roster-management mutations. Mirrors the safe-transform
 * pattern used in lib/validations/scrim.ts: blank optional fields become null
 * so we never write empty strings to the DB.
 */

export const memberRoleSchema = z.enum([
  "owner",
  "captain",
  "member",
  "coach",
  "manager",
]);
export type MemberRoleInput = z.infer<typeof memberRoleSchema>;

/** Captain+ can only assign non-owner roles. Owner transfer is a separate flow. */
export const assignableRoleSchema = z.enum([
  "captain",
  "member",
  "coach",
  "manager",
]);

const inviteBase = z.object({
  division_id: z
    .string()
    .uuid("Divisi tidak valid")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  role: assignableRoleSchema,
});

export const inviteMemberSchema = z
  .discriminatedUnion("channel", [
    inviteBase.extend({
      channel: z.literal("email"),
      email: emailSchema,
    }),
    inviteBase.extend({
      channel: z.literal("wa"),
      phone_wa: waNumberSchema,
    }),
  ])
  .transform((value) => {
    if (value.channel === "email") {
      return {
        channel: "email" as const,
        division_id: value.division_id,
        role: value.role,
        email: value.email,
        phone_wa: null as string | null,
      };
    }
    return {
      channel: "wa" as const,
      division_id: value.division_id,
      role: value.role,
      email: null as string | null,
      phone_wa: value.phone_wa,
    };
  });
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  member_id: z.string().uuid("Member tidak valid"),
  role: assignableRoleSchema,
});

export const updateMemberPositionSchema = z.object({
  member_id: z.string().uuid("Member tidak valid"),
  position: z
    .string()
    .trim()
    .max(60, "Posisi maksimal 60 karakter")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  jersey_number: z
    .union([z.number().int(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) return null;
      return Math.max(0, Math.min(99, Math.trunc(n)));
    }),
});

export const setMemberStatusSchema = z.object({
  member_id: z.string().uuid("Member tidak valid"),
  is_active: z.boolean(),
});

export const removeMemberSchema = z.object({
  member_id: z.string().uuid("Member tidak valid"),
});

export const cancelInviteSchema = z.object({
  invite_id: z.string().uuid("Invite tidak valid"),
});
