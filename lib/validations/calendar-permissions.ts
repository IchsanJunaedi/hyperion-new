import { z } from "zod";

// ============================================================================
// Visibility Enum
// ============================================================================

export const calendarVisibilityEnum = z.enum([
  "private",
  "management-only",
  "captain-only",
  "team-only",
  "selected-members",
  "public-workspace",
]);

export type CalendarVisibility = z.infer<typeof calendarVisibilityEnum>;

// ============================================================================
// Create Calendar Schema
// ============================================================================

export const createCalendarSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  visibility: calendarVisibilityEnum,
  selectedMemberIds: z
    .array(z.string().uuid("ID member harus valid UUID"))
    .optional()
    .default([]),
});

export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;

// ============================================================================
// Update Calendar Schema
// ============================================================================

export const updateCalendarSchema = z.object({
  id: z.string().uuid("ID kalender harus valid UUID"),
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  visibility: calendarVisibilityEnum.optional(),
  selectedMemberIds: z.array(z.string().uuid()).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>;

// ============================================================================
// Set Calendar Visibility Schema
// ============================================================================

export const setCalendarVisibilitySchema = z.object({
  calendarId: z.string().uuid("ID kalender harus valid UUID"),
  visibility: calendarVisibilityEnum,
  selectedMemberIds: z
    .array(z.string().uuid("ID member harus valid UUID"))
    .optional()
    .default([]),
});

export type SetCalendarVisibilityInput = z.infer<
  typeof setCalendarVisibilitySchema
>;

// ============================================================================
// Grant Member Permission Schema
// ============================================================================

export const grantMemberPermissionSchema = z.object({
  calendarId: z.string().uuid("ID kalender harus valid UUID"),
  memberUserId: z.string().uuid("ID member harus valid UUID"),
  canView: z.coerce.boolean().default(true),
  canCreateEvent: z.coerce.boolean().default(false),
  canEditEvent: z.coerce.boolean().default(false),
  canDeleteEvent: z.coerce.boolean().default(false),
  canManagePermissions: z.coerce.boolean().default(false),
});

export type GrantMemberPermissionInput = z.infer<
  typeof grantMemberPermissionSchema
>;

// ============================================================================
// Revoke Member Permission Schema
// ============================================================================

export const revokeMemberPermissionSchema = z.object({
  calendarId: z.string().uuid("ID kalender harus valid UUID"),
  memberUserId: z.string().uuid("ID member harus valid UUID"),
});

export type RevokeMemberPermissionInput = z.infer<
  typeof revokeMemberPermissionSchema
>;

// ============================================================================
// Bulk Grant Permissions Schema
// ============================================================================

export const bulkGrantPermissionsSchema = z.object({
  calendarId: z.string().uuid("ID kalender harus valid UUID"),
  memberIds: z
    .array(z.string().uuid("ID member harus valid UUID"))
    .min(1, "Minimal satu member harus dipilih"),
  permissions: z.object({
    canView: z.coerce.boolean().default(true).optional(),
    canCreateEvent: z.coerce.boolean().default(false).optional(),
    canEditEvent: z.coerce.boolean().default(false).optional(),
    canDeleteEvent: z.coerce.boolean().default(false).optional(),
    canManagePermissions: z.coerce.boolean().default(false).optional(),
  }),
});

export type BulkGrantPermissionsInput = z.infer<
  typeof bulkGrantPermissionsSchema
>;

// ============================================================================
// Set Event Visibility Schema
// ============================================================================

export const setEventVisibilitySchema = z.object({
  eventId: z.string().uuid("ID event harus valid UUID"),
  visibility: calendarVisibilityEnum.optional(),
  allowedMemberIds: z
    .array(z.string().uuid("ID member harus valid UUID"))
    .optional()
    .default([]),
});

export type SetEventVisibilityInput = z.infer<typeof setEventVisibilitySchema>;

// ============================================================================
// Reset Event Visibility Schema
// ============================================================================

export const resetEventVisibilitySchema = z.object({
  eventId: z.string().uuid("ID event harus valid UUID"),
});

export type ResetEventVisibilityInput = z.infer<
  typeof resetEventVisibilitySchema
>;

// ============================================================================
// Get Audit Logs Schema
// ============================================================================

export const getCalendarAuditLogsSchema = z.object({
  calendarId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GetCalendarAuditLogsInput = z.infer<
  typeof getCalendarAuditLogsSchema
>;
