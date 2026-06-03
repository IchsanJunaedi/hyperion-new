/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAboutAlumnusAction, deleteAboutAlumnusAction } from "@/features/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

function makeAuth(email: string) {
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { email } } }) } } as any;
}

beforeEach(() => { vi.clearAllMocks(); });

describe("createAboutAlumnusAction", () => {
  it("rejects non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("other@x.com") as any);
    process.env.ADMIN_EMAIL = "admin@x.com";
    process.env.OWNER_EMAIL = "owner@x.com";
    const r = await createAboutAlumnusAction({ name: "Test", role: "Player", image_url: null, sort_order: 0 });
    expect(r.ok).toBe(false);
  });

  it("inserts when authorized", async () => {
    process.env.OWNER_EMAIL = "owner@x.com";
    vi.mocked(createClient).mockResolvedValue(makeAuth("owner@x.com") as any);
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => ({ insert: mockInsert }),
    } as any);
    const r = await createAboutAlumnusAction({ name: "Test", role: "Player", image_url: null, sort_order: 0 });
    expect(r.ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({ name: "Test", role: "Player", image_url: null, sort_order: 0 });
  });
});

describe("deleteAboutAlumnusAction", () => {
  it("rejects non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuth("other@x.com") as any);
    const r = await deleteAboutAlumnusAction("some-id");
    expect(r.ok).toBe(false);
  });

  it("deletes when authorized", async () => {
    process.env.OWNER_EMAIL = "owner@x.com";
    vi.mocked(createClient).mockResolvedValue(makeAuth("owner@x.com") as any);
    const mockDelete = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => ({ delete: () => ({ eq: mockDelete }) }),
    } as any);
    const r = await deleteAboutAlumnusAction("abc-123");
    expect(r.ok).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith("id", "abc-123");
  });
});
