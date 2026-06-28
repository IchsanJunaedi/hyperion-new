/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMetaPatchAction,
  updateMetaPatchAction,
  activatePatchAction,
  deleteMetaPatchAction,
} from "@/features/meta/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
 
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));
 
const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
 
beforeEach(() => {
  vi.clearAllMocks();
  process.env.OWNER_EMAIL = "owner@test.com";
});
 
describe("Meta Actions Tests", () => {
  describe("createMetaPatchAction", () => {
    it("returns error if not authenticated", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      } as any;
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
 
      const res = await createMetaPatchAction("org-slug", VALID_UUID, "1.0.0");
      expect(res.ok).toBe(false);
      expect((res as any).message).toBe("Anda harus login");
    });
 
    it("returns error if not manager or owner", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "member@test.com" } } }),
        },
        from: vi.fn().mockImplementation(() => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { role: "member" } }),
                }),
              }),
            }),
          }),
        })),
      } as any;
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
 
      const res = await createMetaPatchAction("org-slug", VALID_UUID, "1.0.0");
      expect(res.ok).toBe(false);
      expect((res as any).message).toBe("Hanya Owner/Manager yang bisa membuat patch");
    });
 
    it("creates active patch successfully for owner", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "owner@test.com" } } }),
        },
      } as any;
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
 
      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "meta_patches") {
            return {
              update: () => ({
                eq: () => ({ error: null }),
              }),
              insert: () => ({
                select: () => ({
                  single: async () => ({ data: { id: "patch-1" }, error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any;
      vi.mocked(createAdminClient).mockReturnValue(mockAdmin);
 
      const res = await createMetaPatchAction("org-slug", VALID_UUID, "1.0.0", "Season 41", "notes here");
      expect(res.ok).toBe(true);
      expect((res as any).id).toBe("patch-1");
    });
  });
 
  describe("updateMetaPatchAction", () => {
    it("updates patch successfully", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "owner@test.com" } } }),
        },
      } as any;
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
 
      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "meta_patches") {
            return {
              update: () => ({
                eq: () => ({
                  eq: () => ({ error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any;
      vi.mocked(createAdminClient).mockReturnValue(mockAdmin);
 
      const res = await updateMetaPatchAction("org-slug", VALID_UUID, "patch-1", "1.0.1", "Season 41", "updated notes");
      expect(res.ok).toBe(true);
    });
  });
 
  describe("activatePatchAction", () => {
    it("activates patch successfully", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "owner@test.com" } } }),
        },
      } as any;
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
 
      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "meta_patches") {
            return {
              update: () => ({
                eq: () => ({ error: null }),
              }),
            };
          }
          return {};
        }),
      } as any;
      vi.mocked(createAdminClient).mockReturnValue(mockAdmin);
 
      const res = await activatePatchAction("org-slug", VALID_UUID, "patch-1");
      expect(res.ok).toBe(true);
    });
  });
 
  describe("deleteMetaPatchAction", () => {
    it("deletes patch successfully", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "owner@test.com" } } }),
        },
      } as any;
      vi.mocked(createClient).mockResolvedValue(mockSupabase);
 
      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "meta_patches") {
            return {
              delete: () => ({
                eq: () => ({ error: null }),
              }),
            };
          }
          return {};
        }),
      } as any;
      vi.mocked(createAdminClient).mockReturnValue(mockAdmin);
 
      const res = await deleteMetaPatchAction("org-slug", VALID_UUID, "patch-1");
      expect(res.ok).toBe(true);
    });
  });
});
