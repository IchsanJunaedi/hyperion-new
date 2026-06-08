/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNewsPostAction, deleteNewsPostAction, toggleNewsPostStatusAction } from "@/features/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

function mockClient(email: string) {
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { email, id: "uid-1" } } }) } } as any;
}

beforeEach(() => { vi.clearAllMocks(); });

describe("createNewsPostAction", () => {
  it("blocks non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(mockClient("other@x.com") as any);
    process.env.ADMIN_EMAIL = "admin@x.com";
    process.env.OWNER_EMAIL = "owner@x.com";
    const result = await createNewsPostAction({ title: "T", slug: "t", excerpt: null, content: null, cover_image_url: null, status: "draft", category: null, read_time: null });
    expect(result.ok).toBe(false);
  });

  it("succeeds for admin", async () => {
    process.env.ADMIN_EMAIL = "admin@x.com";
    process.env.OWNER_EMAIL = "owner@x.com";
    vi.mocked(createClient).mockResolvedValue(mockClient("admin@x.com") as any);
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ insert: mockInsert }) } as any);
    const result = await createNewsPostAction({ title: "T", slug: "t", excerpt: null, content: null, cover_image_url: null, status: "draft", category: null, read_time: null });
    expect(result.ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledOnce();
  });
});

describe("deleteNewsPostAction", () => {
  it("blocks non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(mockClient("other@x.com") as any);
    const result = await deleteNewsPostAction("some-id");
    expect(result.ok).toBe(false);
  });
});

describe("toggleNewsPostStatusAction", () => {
  it("flips draft to published", async () => {
    process.env.ADMIN_EMAIL = "admin@x.com";
    vi.mocked(createClient).mockResolvedValue(mockClient("admin@x.com") as any);
    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ update: mockUpdate }) } as any);
    const result = await toggleNewsPostStatusAction("id-1", "draft");
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: "published" }));
  });
});
