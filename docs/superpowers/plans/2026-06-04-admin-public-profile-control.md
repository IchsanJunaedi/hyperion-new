# Admin Public Profile Control — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 4 admin features to control what appears on the public site: News CMS, Results control, Sponsor public toggle, and Player visibility toggle.

**Architecture:** Each feature follows the same pattern — DB migration → types update → queries/actions → admin UI page → public page (where applicable) → sidebar nav entry. All admin actions use `verifyAdminAccess()`. All public pages are Server Components with `export const dynamic = "force-dynamic"`. HMR-safe export pattern everywhere: `const X = ...; export { X }`.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + admin client), Tailwind CSS v4, Lucide React, sonner toast, Vitest. Reuses `ImageUpload`, `ConfirmDeleteDialog`, `AdminSidebarNav` from `features/admin/components/`.

---

## Pre-Commit CI Gate (run before EVERY commit)

```bash
npm run lint && npm run typecheck && npm run test:unit
```
All three must pass. Fix failures before committing.

---

## File Map

| Action | File |
|---|---|
| Create | `supabase/migrations/20260604130000_news_posts.sql` |
| Create | `supabase/migrations/20260604130100_tournament_results_public.sql` |
| Create | `supabase/migrations/20260604130200_sponsors_public.sql` |
| Create | `supabase/migrations/20260604130300_team_members_public.sql` |
| Modify | `types/database.ts` — 4 schema additions |
| Create | `lib/utils/slugify.ts` |
| Create | `lib/utils/__tests__/slugify.test.ts` |
| Modify | `features/admin/queries.ts` — 8 new functions |
| Modify | `features/admin/actions.ts` — 9 new actions |
| Create | `features/admin/__tests__/news-actions.test.ts` |
| Create | `features/admin/__tests__/results-actions.test.ts` |
| Create | `features/admin/__tests__/sponsor-public-actions.test.ts` |
| Create | `features/admin/__tests__/player-public-actions.test.ts` |
| Create | `features/admin/components/NewsAdminClient.tsx` |
| Create | `features/admin/components/NewsForm.tsx` |
| Create | `features/admin/components/ResultsAdminClient.tsx` |
| Create | `features/admin/components/SponsorPublicAdminClient.tsx` |
| Create | `features/admin/components/PlayersAdminClient.tsx` |
| Create | `app/admin/(panel)/news/page.tsx` |
| Create | `app/admin/(panel)/results/page.tsx` |
| Create | `app/admin/(panel)/sponsor-control/page.tsx` |
| Create | `app/admin/(panel)/players/page.tsx` |
| Create | `app/news/page.tsx` |
| Create | `app/news/[slug]/page.tsx` |
| Create | `app/results/page.tsx` |
| Create | `app/sponsors/page.tsx` |
| Modify | `features/admin/components/AdminSidebarNav.tsx` |
| Modify | `features/admin/queries.ts` — update `getDivisionsWithMembers` |
| Modify | `components/landing/Header.tsx` — add /sponsors to DEFAULT_NAV |

---

## Task 1: DB Migrations

**Files:**
- Create: `supabase/migrations/20260604130000_news_posts.sql`
- Create: `supabase/migrations/20260604130100_tournament_results_public.sql`
- Create: `supabase/migrations/20260604130200_sponsors_public.sql`
- Create: `supabase/migrations/20260604130300_team_members_public.sql`

- [ ] **Step 1: Create news_posts migration**

Create `supabase/migrations/20260604130000_news_posts.sql`:
```sql
CREATE TABLE IF NOT EXISTS news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON news_posts USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Create tournament_results_public migration**

Create `supabase/migrations/20260604130100_tournament_results_public.sql`:
```sql
ALTER TABLE tournament_results
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS result_image_url text;
```

- [ ] **Step 3: Create sponsors_public migration**

Create `supabase/migrations/20260604130200_sponsors_public.sql`:
```sql
ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_sort_order int NOT NULL DEFAULT 0;
```

- [ ] **Step 4: Create team_members_public migration**

Create `supabase/migrations/20260604130300_team_members_public.sql`:
```sql
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
```

- [ ] **Step 5: Push all migrations**

```bash
npx supabase db push
```
Expected: 4 migrations applied with no errors.

- [ ] **Step 6: Update types/database.ts — news_posts**

Find the Tables block (alphabetically between `notifications` and `open_trials`) and add:
```ts
      news_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          cover_image_url: string | null
          status: string
          published_at: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          cover_image_url?: string | null
          status?: string
          published_at?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          cover_image_url?: string | null
          status?: string
          published_at?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
```

- [ ] **Step 7: Update types/database.ts — tournament_results additions**

Find `tournament_results` Row block. After `prize_earned: string | null` add:
```ts
          is_public: boolean
          result_image_url: string | null
```
In Insert block after `prize_earned?: string | null`:
```ts
          is_public?: boolean | null
          result_image_url?: string | null
```
In Update block after `prize_earned?: string | null`:
```ts
          is_public?: boolean | null
          result_image_url?: string | null
```

- [ ] **Step 8: Update types/database.ts — sponsors additions**

Find `sponsors` Row block. After `updated_at: string` add:
```ts
          is_public: boolean
          public_sort_order: number
```
In Insert/Update blocks, add:
```ts
          is_public?: boolean | null
          public_sort_order?: number | null
```

- [ ] **Step 9: Update types/database.ts — team_members addition**

Find `team_members` Row block. After `user_id: string` add:
```ts
          is_public: boolean
```
In Insert/Update blocks, add:
```ts
          is_public?: boolean | null
```

- [ ] **Step 10: Run CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: 0 errors.

- [ ] **Step 11: Commit**

```bash
git add supabase/migrations/ types/database.ts
git commit -m "feat(admin-public): DB migrations + type updates for 4 features"
```

---

## Task 2: Slugify Utility + Test

**Files:**
- Create: `lib/utils/slugify.ts`
- Create: `lib/utils/__tests__/slugify.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/utils/__tests__/slugify.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("removes special characters", () => {
    expect(slugify("Juara 1 — MPL Season 15!")).toBe("juara-1-mpl-season-15");
  });
  it("collapses multiple hyphens", () => {
    expect(slugify("a  b   c")).toBe("a-b-c");
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });
  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:unit -- lib/utils/__tests__/slugify.test.ts
```
Expected: FAIL — "Cannot find module '@/lib/utils/slugify'"

- [ ] **Step 3: Implement slugify**

Create `lib/utils/slugify.ts`:
```ts
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:unit -- lib/utils/__tests__/slugify.test.ts
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/slugify.ts lib/utils/__tests__/slugify.test.ts
git commit -m "feat(admin-public): add slugify utility + tests"
```

---

## Task 3: News Queries + Actions + Tests

**Files:**
- Modify: `features/admin/queries.ts`
- Modify: `features/admin/actions.ts`
- Create: `features/admin/__tests__/news-actions.test.ts`

- [ ] **Step 1: Add news types + queries to features/admin/queries.ts**

Add at the bottom of `features/admin/queries.ts`:
```ts
export type NewsPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
};

export async function getNewsPosts(): Promise<NewsPost[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("news_posts")
    .select("id, title, slug, excerpt, content, cover_image_url, status, published_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("getNewsPosts:", error);
  return (data ?? []) as NewsPost[];
}

export async function getPublishedNewsPosts(): Promise<NewsPost[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("news_posts")
    .select("id, title, slug, excerpt, cover_image_url, published_at, created_at, content, status")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);
  if (error) console.error("getPublishedNewsPosts:", error);
  return (data ?? []) as NewsPost[];
}

export async function getNewsPostBySlug(slug: string): Promise<NewsPost | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("news_posts")
    .select("id, title, slug, excerpt, content, cover_image_url, status, published_at, created_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) console.error("getNewsPostBySlug:", error);
  return data as NewsPost | null;
}
```

- [ ] **Step 2: Add news actions to features/admin/actions.ts**

Add after the existing `toggleHeroTournamentAction` block:
```ts
// ── News CMS ──────────────────────────────────────────────────────────────────

export async function createNewsPostAction(data: {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  status: string;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const published_at = data.status === "published" ? new Date().toISOString() : null;
  const { error } = await admin.from("news_posts").insert({
    ...data,
    published_at,
    created_by: user!.id,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { ok: true };
}

export async function updateNewsPostAction(
  id: string,
  data: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    cover_image_url: string | null;
    status: string;
  }
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("news_posts")
    .select("status, published_at")
    .eq("id", id)
    .maybeSingle();

  const published_at =
    data.status === "published" && !existing?.published_at
      ? new Date().toISOString()
      : existing?.published_at ?? null;

  const { error } = await admin
    .from("news_posts")
    .update({ ...data, published_at })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/news");
  revalidatePath(`/news/${data.slug}`);
  revalidatePath("/admin/news");
  return { ok: true };
}

export async function deleteNewsPostAction(id: string): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("news_posts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { ok: true };
}

export async function toggleNewsPostStatusAction(
  id: string,
  currentStatus: string
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const nextStatus = currentStatus === "published" ? "draft" : "published";
  const published_at = nextStatus === "published" ? new Date().toISOString() : null;
  const { error } = await admin
    .from("news_posts")
    .update({ status: nextStatus, ...(published_at ? { published_at } : {}) })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/news");
  revalidatePath("/admin/news");
  return { ok: true };
}
```

- [ ] **Step 3: Write news action tests**

Create `features/admin/__tests__/news-actions.test.ts`:
```ts
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
    const result = await createNewsPostAction({ title: "T", slug: "t", excerpt: null, content: null, cover_image_url: null, status: "draft" });
    expect(result.ok).toBe(false);
  });

  it("succeeds for admin", async () => {
    process.env.ADMIN_EMAIL = "admin@x.com";
    process.env.OWNER_EMAIL = "owner@x.com";
    vi.mocked(createClient).mockResolvedValue(mockClient("admin@x.com") as any);
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ insert: mockInsert }) } as any);
    const result = await createNewsPostAction({ title: "T", slug: "t", excerpt: null, content: null, cover_image_url: null, status: "draft" });
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
```

- [ ] **Step 4: Run tests**

```bash
npm run test:unit -- features/admin/__tests__/news-actions.test.ts
```
Expected: all pass.

- [ ] **Step 5: Run CI gate + commit**

```bash
npm run lint && npm run typecheck && npm run test:unit
git add features/admin/queries.ts features/admin/actions.ts features/admin/__tests__/news-actions.test.ts
git commit -m "feat(admin-public): news queries, actions + tests"
```

---

## Task 4: News Admin UI

**Files:**
- Create: `features/admin/components/NewsForm.tsx`
- Create: `features/admin/components/NewsAdminClient.tsx`
- Create: `app/admin/(panel)/news/page.tsx`

- [ ] **Step 1: Create NewsForm.tsx**

Create `features/admin/components/NewsForm.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "./ImageUpload";
import { createNewsPostAction, updateNewsPostAction } from "@/features/admin/actions";
import { slugify } from "@/lib/utils/slugify";
import type { NewsPost } from "@/features/admin/queries";

interface Props {
  entry?: NewsPost;
  onDone: () => void;
}

const NewsForm = ({ entry, onDone }: Props) => {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [slug, setSlug] = useState(entry?.slug ?? "");
  const [excerpt, setExcerpt] = useState(entry?.excerpt ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(entry?.cover_image_url ?? null);
  const [status, setStatus] = useState(entry?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!entry);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const inputClass = "w-full border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] outline-none transition focus:border-[#F5C400]/50 placeholder:text-[#6B6A68]";
  const labelClass = "mb-1 block text-xs font-medium text-[#9B9A97]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) { toast.error("Title dan slug wajib diisi"); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content: content.trim() || null,
      cover_image_url: coverUrl,
      status,
    };
    const result = entry
      ? await updateNewsPostAction(entry.id, payload)
      : await createNewsPostAction(payload);
    setSaving(false);
    if (!result.ok) { toast.error((result as { ok: false; message: string }).message); return; }
    toast.success(entry ? "Artikel diperbarui" : "Artikel dibuat");
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-[#2D2D2D] bg-[#141414] p-5">
      <div>
        <label className={labelClass}>Title *</label>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Juara 1 di MPL Season 15" required />
      </div>
      <div>
        <label className={labelClass}>Slug *</label>
        <input className={inputClass} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} placeholder="juara-1-di-mpl-season-15" required />
        <p className="mt-1 text-[10px] text-[#6B6A68]">URL: /news/{slug || "..."}</p>
      </div>
      <div>
        <label className={labelClass}>Excerpt (ringkasan singkat)</label>
        <textarea className={inputClass + " min-h-[60px] resize-y"} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Hyperion Team berhasil meraih gelar juara..." />
      </div>
      <div>
        <label className={labelClass}>Konten artikel</label>
        <textarea className={inputClass + " min-h-[160px] resize-y"} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tulis konten artikel di sini..." />
      </div>
      <div>
        <ImageUpload value={coverUrl} onChange={setCoverUrl} folder="news" label="Cover Image (opsional)" />
      </div>
      <div>
        <label className={labelClass}>Status</label>
        <div className="flex gap-2">
          {(["draft", "published"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition cursor-pointer ${status === s ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400]/50 hover:text-[#F5C400]"}`}>
              {s === "draft" ? "Draft" : "Published"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="cursor-pointer border border-[#F5C400] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50">
          {saving ? "Menyimpan..." : entry ? "Simpan" : "Buat Artikel"}
        </button>
        <button type="button" onClick={onDone}
          className="cursor-pointer border border-[#2D2D2D] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#9B9A97] transition hover:border-[#E5E2E1] hover:text-[#E5E2E1]">
          Batal
        </button>
      </div>
    </form>
  );
};
export { NewsForm };
```

- [ ] **Step 2: Create NewsAdminClient.tsx**

Create `features/admin/components/NewsAdminClient.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Newspaper } from "lucide-react";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { NewsForm } from "./NewsForm";
import { deleteNewsPostAction, toggleNewsPostStatusAction } from "@/features/admin/actions";
import type { NewsPost } from "@/features/admin/queries";

interface Props { posts: NewsPost[]; }

const NewsAdminClient = ({ posts: initial }: Props) => {
  const [posts, setPosts] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsPost | null>(null);
  const [deleting, setDeleting] = useState<NewsPost | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [, startTransition] = useTransition();

  const handleDone = () => { setShowForm(false); setEditing(null); window.location.reload(); };

  const handleToggleStatus = (post: NewsPost) => {
    startTransition(async () => {
      const result = await toggleNewsPostStatusAction(post.id, post.status);
      if (!result.ok) { toast.error((result as { ok: false; message: string }).message); return; }
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: post.status === "published" ? "draft" : "published" } : p));
      toast.success(post.status === "published" ? "Dikembalikan ke draft" : "Dipublikasikan");
    });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteNewsPostAction(deleting.id);
    setDeletePending(false);
    if (!result.ok) { toast.error((result as { ok: false; message: string }).message); return; }
    toast.success("Artikel dihapus");
    setPosts((prev) => prev.filter((p) => p.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white">News</h1>
          <p className="mt-1 text-xs text-[#6B6A68]">Artikel berita yang tampil di halaman publik <span className="text-white/50">/news</span>.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex cursor-pointer items-center gap-2 border border-[#F5C400] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black">
          <Plus className="h-3.5 w-3.5" /> Buat Artikel
        </button>
      </div>

      {showForm && !editing && <div className="mb-6"><NewsForm onDone={handleDone} /></div>}

      {posts.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Newspaper className="h-8 w-8 text-[#2D2D2D]" />
          <p className="text-sm text-[#6B6A68]">Belum ada artikel. Buat artikel pertama.</p>
        </div>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id}>
            {editing?.id === post.id ? (
              <NewsForm entry={post} onDone={handleDone} />
            ) : (
              <div className="flex items-center gap-4 border border-[#2D2D2D] bg-[#141414] p-4">
                {post.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.cover_image_url} alt="" className="h-12 w-20 shrink-0 object-cover" />
                ) : (
                  <div className="flex h-12 w-20 shrink-0 items-center justify-center bg-[#1E1E1E]">
                    <Newspaper className="h-5 w-5 text-[#2D2D2D]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#E5E2E1]">{post.title}</p>
                  <div className="mt-0.5 flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${post.status === "published" ? "text-green-400" : "text-[#6B6A68]"}`}>
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                    {post.published_at && (
                      <span className="text-xs text-[#6B6A68]">{post.published_at.slice(0, 10)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleStatus(post)}
                    className={`cursor-pointer border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition ${post.status === "published" ? "border-[#2D2D2D] text-[#6B6A68] hover:border-white/30 hover:text-white/60" : "border-green-400/50 text-green-400 hover:bg-green-400/10"}`}>
                    {post.status === "published" ? "Draft" : "Publish"}
                  </button>
                  <button onClick={() => setEditing(post)}
                    className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(post)}
                    className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={!!deleting} onCancel={() => setDeleting(null)} onConfirm={handleDelete}
        pending={deletePending} title="Hapus Artikel"
        message={`Hapus "${deleting?.title}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmPhrase="HAPUS"
      />
    </div>
  );
};
export { NewsAdminClient };
```

- [ ] **Step 3: Create admin/news page**

Create `app/admin/(panel)/news/page.tsx`:
```tsx
import { getNewsPosts } from "@/features/admin/queries";
import { NewsAdminClient } from "@/features/admin/components/NewsAdminClient";

export const dynamic = "force-dynamic";

const AdminNewsPage = async () => {
  const posts = await getNewsPosts();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">News</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-10">
        <NewsAdminClient posts={posts} />
      </main>
    </>
  );
};
export { AdminNewsPage as default };
```

- [ ] **Step 4: Add News to AdminSidebarNav**

In `features/admin/components/AdminSidebarNav.tsx`, add `Newspaper` to imports and add to KONTEN LIST:
```tsx
// Add Newspaper to imports
import { ..., Newspaper } from "lucide-react";

// Add to KONTEN LIST items (after Achievements, before Tournaments):
{ href: "/admin/news", Icon: Newspaper, label: "News" },
```

- [ ] **Step 5: Run CI gate + commit**

```bash
npm run lint && npm run typecheck && npm run test:unit
git add features/admin/components/NewsForm.tsx features/admin/components/NewsAdminClient.tsx app/admin/\(panel\)/news/page.tsx features/admin/components/AdminSidebarNav.tsx
git commit -m "feat(admin-public): news admin UI — list, create, edit, delete, publish toggle"
```

---

## Task 5: Public /news Pages

**Files:**
- Create: `app/news/page.tsx`
- Create: `app/news/[slug]/page.tsx`

- [ ] **Step 1: Create /news list page**

Create `app/news/page.tsx`:
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getPublishedNewsPosts } from "@/features/admin/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "News — Hyperion Team",
  description: "Berita dan update terbaru dari Hyperion Team.",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const NewsPage = async () => {
  const posts = await getPublishedNewsPosts();
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        <section className="border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">Hyperion Team</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">News</h1>
            <p className="mt-3 text-sm text-white/55">Berita dan update terbaru dari Hyperion Team.</p>
          </div>
        </section>

        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {posts.length === 0 ? (
              <div className="border border-white/12 bg-[#071428] py-20 text-center">
                <Newspaper className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/45">Belum ada artikel yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Link key={post.id} href={`/news/${post.slug}`}
                    className="group flex flex-col border border-white/10 bg-[#071428] transition hover:border-[#F5C400]/40">
                    {post.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.cover_image_url} alt={post.title} className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center bg-[#0C1E3C]">
                        <Newspaper className="h-10 w-10 text-white/10" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#F5C400]/70">
                        {formatDate(post.published_at)}
                      </p>
                      <p className="font-black uppercase leading-tight tracking-tight text-white group-hover:text-[#F5C400] transition">
                        {post.title}
                      </p>
                      {post.excerpt && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-white/45">{post.excerpt}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};
export { NewsPage as default };
```

- [ ] **Step 2: Create /news/[slug] detail page**

Create `app/news/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getNewsPostBySlug, getPublishedNewsPosts } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} — Hyperion Team`,
    description: post.excerpt ?? undefined,
    openGraph: post.cover_image_url ? { images: [post.cover_image_url] } : undefined,
  };
}

export async function generateStaticParams() {
  const posts = await getPublishedNewsPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const NewsDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const post = await getNewsPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt={post.title} className="h-64 w-full object-cover sm:h-80 lg:h-96" />
        )}
        <article className="mx-auto max-w-3xl px-6 py-16 sm:px-10">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
            {formatDate(post.published_at)}
          </p>
          <h1 className="mb-6 text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mb-8 border-l-2 border-[#F5C400]/40 pl-4 text-base leading-relaxed text-white/60">
              {post.excerpt}
            </p>
          )}
          {post.content && (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
              {post.content}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
};
export { NewsDetailPage as default };
```

- [ ] **Step 3: Add News to Header DEFAULT_NAV**

In `components/landing/Header.tsx`, add News link:
```ts
const DEFAULT_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Achievement", href: "/gallery" },
  { label: "Division", href: "/divisions" },
  { label: "News", href: "/news" },
  { label: "Schedule", href: "/schedule" },
  { label: "Rekrutmen", href: "/rekrutmen" },
];
```

- [ ] **Step 4: Run CI gate + commit**

```bash
npm run lint && npm run typecheck && npm run test:unit
git add app/news/ components/landing/Header.tsx
git commit -m "feat(admin-public): public /news list + /news/[slug] detail pages"
```

---

## Task 6: Results Queries + Actions + Tests

**Files:**
- Modify: `features/admin/queries.ts`
- Modify: `features/admin/actions.ts`
- Create: `features/admin/__tests__/results-actions.test.ts`

- [ ] **Step 1: Add results types + queries**

Add to bottom of `features/admin/queries.ts`:
```ts
export type AdminResult = {
  id: string;
  tournament_id: string;
  tournament_name: string;
  tournament_start_date: string;
  placement: number | null;
  prize_earned: string | null;
  notes: string | null;
  recorded_at: string;
  is_public: boolean;
  result_image_url: string | null;
};

export type PublicResult = {
  id: string;
  tournament_name: string;
  tournament_start_date: string;
  placement: number | null;
  prize_earned: string | null;
  recorded_at: string;
  result_image_url: string | null;
};

type RawResultRow = {
  id: string;
  tournament_id: string;
  placement: number | null;
  prize_earned: string | null;
  notes: string | null;
  recorded_at: string;
  is_public: boolean;
  result_image_url: string | null;
  tournaments: { name: string; start_date: string } | null;
};

export async function getResultsForAdmin(): Promise<AdminResult[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournament_results")
    .select("id, tournament_id, placement, prize_earned, notes, recorded_at, is_public, result_image_url, tournaments(name, start_date)")
    .order("recorded_at", { ascending: false })
    .limit(50);
  if (error) console.error("getResultsForAdmin:", error);
  return ((data ?? []) as unknown as RawResultRow[]).map((r) => ({
    id: r.id,
    tournament_id: r.tournament_id,
    tournament_name: r.tournaments?.name ?? "—",
    tournament_start_date: r.tournaments?.start_date ?? "",
    placement: r.placement,
    prize_earned: r.prize_earned,
    notes: r.notes,
    recorded_at: r.recorded_at,
    is_public: r.is_public,
    result_image_url: r.result_image_url,
  }));
}

export async function getPublicResults(): Promise<PublicResult[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournament_results")
    .select("id, placement, prize_earned, recorded_at, result_image_url, tournaments(name, start_date)")
    .eq("is_public", true)
    .order("recorded_at", { ascending: false })
    .limit(50);
  if (error) console.error("getPublicResults:", error);
  return ((data ?? []) as unknown as RawResultRow[]).map((r) => ({
    id: r.id,
    tournament_name: r.tournaments?.name ?? "—",
    tournament_start_date: r.tournaments?.start_date ?? "",
    placement: r.placement,
    prize_earned: r.prize_earned,
    recorded_at: r.recorded_at,
    result_image_url: r.result_image_url,
  }));
}
```

- [ ] **Step 2: Add results actions**

Add to `features/admin/actions.ts`:
```ts
// ── Results Public Control ─────────────────────────────────────────────────────

export async function toggleResultPublicAction(
  resultId: string,
  nextValue: boolean
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("tournament_results")
    .update({ is_public: nextValue })
    .eq("id", resultId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/results");
  revalidatePath("/admin/results");
  return { ok: true };
}

export async function updateResultImageAction(
  resultId: string,
  imageUrl: string | null
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("tournament_results")
    .update({ result_image_url: imageUrl })
    .eq("id", resultId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/results");
  revalidatePath("/admin/results");
  return { ok: true };
}
```

- [ ] **Step 3: Write results action tests**

Create `features/admin/__tests__/results-actions.test.ts`:
```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleResultPublicAction, updateResultImageAction } from "@/features/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

function mockClient(email: string) {
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { email } } }) } } as any;
}

beforeEach(() => { vi.clearAllMocks(); });

describe("toggleResultPublicAction", () => {
  it("blocks non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(mockClient("other@x.com") as any);
    process.env.ADMIN_EMAIL = "admin@x.com";
    process.env.OWNER_EMAIL = "owner@x.com";
    const result = await toggleResultPublicAction("id-1", true);
    expect(result.ok).toBe(false);
  });

  it("succeeds for owner", async () => {
    process.env.OWNER_EMAIL = "owner@x.com";
    vi.mocked(createClient).mockResolvedValue(mockClient("owner@x.com") as any);
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ update: mockUpdate }) } as any);
    const result = await toggleResultPublicAction("id-1", true);
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ is_public: true });
  });
});

describe("updateResultImageAction", () => {
  it("blocks non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(mockClient("other@x.com") as any);
    const result = await updateResultImageAction("id-1", "https://example.com/img.jpg");
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm run test:unit -- features/admin/__tests__/results-actions.test.ts
```
Expected: all pass.

- [ ] **Step 5: Run CI gate + commit**

```bash
npm run lint && npm run typecheck && npm run test:unit
git add features/admin/queries.ts features/admin/actions.ts features/admin/__tests__/results-actions.test.ts
git commit -m "feat(admin-public): results queries, actions + tests"
```

---

## Task 7: Results Admin UI + Public Page

**Files:**
- Create: `features/admin/components/ResultsAdminClient.tsx`
- Create: `app/admin/(panel)/results/page.tsx`
- Create: `app/results/page.tsx`

- [ ] **Step 1: Create ResultsAdminClient.tsx**

Create `features/admin/components/ResultsAdminClient.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Medal, ImagePlus, X } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { toggleResultPublicAction, updateResultImageAction } from "@/features/admin/actions";
import type { AdminResult } from "@/features/admin/queries";

interface Props { results: AdminResult[]; }

const PLACEMENT_COLOR: Record<number, string> = { 1: "text-[#F5C400]", 2: "text-[#9B9A97]", 3: "text-[#CD7F32]" };

const ResultsAdminClient = ({ results: initial }: Props) => {
  const [results, setResults] = useState(initial);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleTogglePublic = (id: string, current: boolean) => {
    const next = !current;
    setResults((prev) => prev.map((r) => r.id === id ? { ...r, is_public: next } : r));
    startTransition(async () => {
      const result = await toggleResultPublicAction(id, next);
      if (!result.ok) {
        toast.error((result as { ok: false; message: string }).message);
        setResults((prev) => prev.map((r) => r.id === id ? { ...r, is_public: current } : r));
      } else {
        toast.success(next ? "Hasil dipublikasikan" : "Hasil disembunyikan dari publik");
      }
    });
  };

  const handleImageChange = async (id: string, url: string | null) => {
    setResults((prev) => prev.map((r) => r.id === id ? { ...r, result_image_url: url } : r));
    const result = await updateResultImageAction(id, url);
    if (!result.ok) toast.error((result as { ok: false; message: string }).message);
    else toast.success(url ? "Foto disimpan" : "Foto dihapus");
    setUploadingId(null);
  };

  const publicCount = results.filter((r) => r.is_public).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Results</h1>
        <p className="mt-1 text-xs text-[#6B6A68]">
          Upload foto podium/poster dan toggle mana hasil turnamen yang tampil di <span className="text-white/50">/results</span>.
          Hasil dicatat otomatis oleh manager saat menyelesaikan turnamen di workspace.
        </p>
        {publicCount > 0 && <p className="mt-1.5 text-xs font-semibold text-[#F5C400]">{publicCount} publik</p>}
      </div>

      {results.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center border border-[#2D2D2D]">
          <Medal className="h-8 w-8 text-[#2D2D2D]" />
          <p className="text-sm text-[#6B6A68]">Belum ada hasil turnamen. Manager perlu menyelesaikan turnamen di workspace terlebih dahulu.</p>
        </div>
      )}

      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.id} className={`rounded border p-4 transition ${r.is_public ? "border-[#F5C400]/30 bg-[#1a1800]" : "border-[#2D2D2D] bg-[#141414]"}`}>
            <div className="flex items-start gap-4">
              {/* Photo */}
              <div className="shrink-0">
                {r.result_image_url ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.result_image_url} alt="" className="h-16 w-24 object-cover" />
                    <button onClick={() => handleImageChange(r.id, null)}
                      className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setUploadingId(r.id)}
                    className="flex h-16 w-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400]/50 hover:text-[#F5C400] transition">
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[9px] font-bold uppercase tracking-wide">Foto</span>
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#D4D4D4] truncate">{r.tournament_name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                  {r.placement ? (
                    <span className={`font-bold ${PLACEMENT_COLOR[r.placement] ?? "text-white/60"}`}>
                      Juara {r.placement}
                    </span>
                  ) : (
                    <span className="text-[#6B6A68]">Gugur</span>
                  )}
                  {r.prize_earned && <span className="text-[#6B6A68]">· Rp {Number(r.prize_earned).toLocaleString("id-ID")}</span>}
                  <span className="text-[#6B6A68]">· {r.recorded_at.slice(0, 10)}</span>
                </div>
                {r.notes && <p className="mt-1 text-xs text-[#6B6A68] truncate">{r.notes}</p>}
              </div>

              {/* Toggle */}
              <button onClick={() => handleTogglePublic(r.id, r.is_public)}
                className={`shrink-0 cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition ${r.is_public ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400]/50 hover:text-[#F5C400]"}`}>
                {r.is_public ? "Publik ✓" : "Publik"}
              </button>
            </div>

            {/* Inline image upload when triggered */}
            {uploadingId === r.id && (
              <div className="mt-3 border-t border-[#2D2D2D] pt-3">
                <ImageUpload value={r.result_image_url} onChange={(url) => handleImageChange(r.id, url)} folder="results" label="Upload foto podium / poster" />
                <button onClick={() => setUploadingId(null)} className="mt-2 text-xs text-[#6B6A68] hover:text-[#9B9A97] cursor-pointer">Batal</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export { ResultsAdminClient };
```

- [ ] **Step 2: Create admin/results page**

Create `app/admin/(panel)/results/page.tsx`:
```tsx
import { getResultsForAdmin } from "@/features/admin/queries";
import { ResultsAdminClient } from "@/features/admin/components/ResultsAdminClient";

export const dynamic = "force-dynamic";

const AdminResultsPage = async () => {
  const results = await getResultsForAdmin();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Results</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-10">
        <ResultsAdminClient results={results} />
      </main>
    </>
  );
};
export { AdminResultsPage as default };
```

- [ ] **Step 3: Create public /results page**

Create `app/results/page.tsx`:
```tsx
import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getPublicResults } from "@/features/admin/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Results — Hyperion Team",
  description: "Hasil turnamen Hyperion Team.",
};

const PLACEMENT_LABEL: Record<number, string> = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };
const PLACEMENT_COLOR: Record<number, string> = {
  1: "text-[#F5C400] border-[#F5C400]/30 bg-[#F5C400]/10",
  2: "text-[#9B9A97] border-[#9B9A97]/30 bg-white/5",
  3: "text-[#CD7F32] border-[#CD7F32]/30 bg-[#CD7F32]/10",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const ResultsPage = async () => {
  const results = await getPublicResults();
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        <section className="border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">Hyperion Team</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">Results</h1>
            <p className="mt-3 text-sm text-white/55">Rekam jejak hasil turnamen Hyperion Team.</p>
          </div>
        </section>
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {results.length === 0 ? (
              <div className="border border-white/12 bg-[#071428] py-20 text-center">
                <Trophy className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/45">Belum ada hasil turnamen yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r) => (
                  <div key={r.id} className="flex flex-col border border-white/10 bg-[#071428]">
                    {r.result_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.result_image_url} alt={r.tournament_name} className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-[#0C1E3C]">
                        <Trophy className="h-10 w-10 text-white/10" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{formatDate(r.recorded_at)}</p>
                      <p className="font-black uppercase leading-tight tracking-tight text-white">{r.tournament_name}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {r.placement && r.placement <= 3 ? (
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PLACEMENT_COLOR[r.placement]}`}>
                            {PLACEMENT_LABEL[r.placement]}
                          </span>
                        ) : (
                          <span className="text-xs text-white/30">Gugur</span>
                        )}
                        {r.prize_earned && (
                          <span className="text-xs text-[#F5C400]/70">Rp {Number(r.prize_earned).toLocaleString("id-ID")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};
export { ResultsPage as default };
```

- [ ] **Step 4: Add Results to AdminSidebarNav**

In `features/admin/components/AdminSidebarNav.tsx`, add `Medal` to imports and to KONTEN LIST:
```tsx
import { ..., Medal } from "lucide-react";
// Add to KONTEN LIST after Tournaments & Schedule:
{ href: "/admin/results", Icon: Medal, label: "Results" },
```

- [ ] **Step 5: Run CI gate + commit**

```bash
npm run lint && npm run typecheck && npm run test:unit
git add features/admin/components/ResultsAdminClient.tsx app/admin/\(panel\)/results/page.tsx app/results/page.tsx features/admin/components/AdminSidebarNav.tsx
git commit -m "feat(admin-public): results admin UI + public /results page"
```

---

## Task 8: Sponsor Public Queries + Actions + Tests

**Files:**
- Modify: `features/admin/queries.ts`
- Modify: `features/admin/actions.ts`
- Create: `features/admin/__tests__/sponsor-public-actions.test.ts`

- [ ] **Step 1: Add sponsor public queries**

Add to bottom of `features/admin/queries.ts`:
```ts
export type AdminSponsor = {
  id: string;
  name: string;
  logo_url: string | null;
  status: string;
  is_public: boolean;
  public_sort_order: number;
};

export type PublicSponsor = {
  id: string;
  name: string;
  logo_url: string;
  public_sort_order: number;
};

export async function getSponsorsForAdmin(): Promise<AdminSponsor[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sponsors")
    .select("id, name, logo_url, status, is_public, public_sort_order")
    .order("public_sort_order", { ascending: true })
    .limit(100);
  if (error) console.error("getSponsorsForAdmin:", error);
  return (data ?? []) as AdminSponsor[];
}

export async function getPublicSponsors(): Promise<PublicSponsor[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sponsors")
    .select("id, name, logo_url, public_sort_order")
    .eq("is_public", true)
    .not("logo_url", "is", null)
    .order("public_sort_order", { ascending: true })
    .limit(50);
  if (error) console.error("getPublicSponsors:", error);
  return (data ?? []) as unknown as PublicSponsor[];
}
```

- [ ] **Step 2: Add sponsor public actions**

Add to `features/admin/actions.ts`:
```ts
// ── Sponsor Public Control ─────────────────────────────────────────────────────

export async function toggleSponsorPublicAction(
  sponsorId: string,
  nextValue: boolean
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("sponsors")
    .update({ is_public: nextValue })
    .eq("id", sponsorId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/sponsors");
  revalidatePath("/admin/sponsor-control");
  return { ok: true };
}

export async function updateSponsorSortAction(
  sponsorId: string,
  newOrder: number
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("sponsors")
    .update({ public_sort_order: newOrder })
    .eq("id", sponsorId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/sponsors");
  revalidatePath("/admin/sponsor-control");
  return { ok: true };
}
```

- [ ] **Step 3: Write sponsor public action tests**

Create `features/admin/__tests__/sponsor-public-actions.test.ts`:
```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleSponsorPublicAction, updateSponsorSortAction } from "@/features/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

function mockClient(email: string) {
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { email } } }) } } as any;
}

beforeEach(() => { vi.clearAllMocks(); });

describe("toggleSponsorPublicAction", () => {
  it("blocks non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(mockClient("other@x.com") as any);
    process.env.ADMIN_EMAIL = "admin@x.com";
    process.env.OWNER_EMAIL = "owner@x.com";
    const result = await toggleSponsorPublicAction("id-1", true);
    expect(result.ok).toBe(false);
  });

  it("succeeds for owner", async () => {
    process.env.OWNER_EMAIL = "owner@x.com";
    vi.mocked(createClient).mockResolvedValue(mockClient("owner@x.com") as any);
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ update: vi.fn().mockReturnValue({ eq: mockEq }) }) } as any);
    const result = await toggleSponsorPublicAction("id-1", true);
    expect(result.ok).toBe(true);
  });
});

describe("updateSponsorSortAction", () => {
  it("blocks non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(mockClient("other@x.com") as any);
    const result = await updateSponsorSortAction("id-1", 2);
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 4: Run tests + CI gate + commit**

```bash
npm run test:unit -- features/admin/__tests__/sponsor-public-actions.test.ts
npm run lint && npm run typecheck && npm run test:unit
git add features/admin/queries.ts features/admin/actions.ts features/admin/__tests__/sponsor-public-actions.test.ts
git commit -m "feat(admin-public): sponsor public queries, actions + tests"
```

---

## Task 9: Sponsor Admin UI + Public Page

**Files:**
- Create: `features/admin/components/SponsorPublicAdminClient.tsx`
- Create: `app/admin/(panel)/sponsor-control/page.tsx`
- Create: `app/sponsors/page.tsx`

- [ ] **Step 1: Create SponsorPublicAdminClient.tsx**

Create `features/admin/components/SponsorPublicAdminClient.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Handshake, ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { toggleSponsorPublicAction, updateSponsorSortAction } from "@/features/admin/actions";
import type { AdminSponsor } from "@/features/admin/queries";

interface Props { sponsors: AdminSponsor[]; }

const SponsorPublicAdminClient = ({ sponsors: initial }: Props) => {
  const [sponsors, setSponsors] = useState(initial);
  const [, startTransition] = useTransition();

  const handleTogglePublic = (id: string, current: boolean) => {
    const target = sponsors.find((s) => s.id === id);
    if (!target?.logo_url && !current) { toast.error("Sponsor tanpa logo tidak bisa dipublikasikan"); return; }
    const next = !current;
    setSponsors((prev) => prev.map((s) => s.id === id ? { ...s, is_public: next } : s));
    startTransition(async () => {
      const result = await toggleSponsorPublicAction(id, next);
      if (!result.ok) {
        toast.error((result as { ok: false; message: string }).message);
        setSponsors((prev) => prev.map((s) => s.id === id ? { ...s, is_public: current } : s));
      } else {
        toast.success(next ? "Sponsor dipublikasikan" : "Sponsor disembunyikan");
      }
    });
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const sorted = [...sponsors].sort((a, b) => a.public_sort_order - b.public_sort_order);
    const idx = sorted.findIndex((s) => s.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const current = sorted[idx];
    const swap = sorted[swapIdx];
    const newCurrentOrder = swap.public_sort_order;
    const newSwapOrder = current.public_sort_order;

    setSponsors((prev) => prev.map((s) => {
      if (s.id === current.id) return { ...s, public_sort_order: newCurrentOrder };
      if (s.id === swap.id) return { ...s, public_sort_order: newSwapOrder };
      return s;
    }));

    startTransition(async () => {
      await Promise.all([
        updateSponsorSortAction(current.id, newCurrentOrder),
        updateSponsorSortAction(swap.id, newSwapOrder),
      ]);
    });
  };

  const publicCount = sponsors.filter((s) => s.is_public).length;
  const sorted = [...sponsors].sort((a, b) => a.public_sort_order - b.public_sort_order);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Sponsors Publik</h1>
        <p className="mt-1 text-xs text-[#6B6A68]">
          Pilih sponsor dari workspace yang tampil di halaman publik <span className="text-white/50">/sponsors</span>.
          Hanya sponsor dengan logo yang bisa dipublikasikan.
        </p>
        {publicCount > 0 && <p className="mt-1.5 text-xs font-semibold text-[#F5C400]">{publicCount} publik</p>}
      </div>

      {sponsors.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center border border-[#2D2D2D]">
          <Handshake className="h-8 w-8 text-[#2D2D2D]" />
          <p className="text-sm text-[#6B6A68]">Belum ada sponsor di workspace. Tambahkan sponsor di menu Sponsors workspace terlebih dahulu.</p>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((s, idx) => (
          <div key={s.id} className={`flex items-center gap-4 rounded border px-4 py-3 transition ${s.is_public ? "border-[#F5C400]/30 bg-[#1a1800]" : "border-[#2D2D2D] bg-[#141414]"}`}>
            {/* Logo */}
            {s.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo_url} alt={s.name} className="h-10 w-16 shrink-0 object-contain" />
            ) : (
              <div className="flex h-10 w-16 shrink-0 items-center justify-center bg-[#1E1E1E]">
                <AlertCircle className="h-4 w-4 text-[#6B6A68]" title="Tidak ada logo" />
              </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#D4D4D4]">{s.name}</p>
              <p className="text-xs text-[#6B6A68]">
                Status: {s.status}
                {!s.logo_url && <span className="ml-2 text-red-400/70">· Tidak ada logo</span>}
              </p>
            </div>

            {/* Reorder (only for public) */}
            {s.is_public && (
              <div className="flex flex-col gap-0.5">
                <button onClick={() => handleMove(s.id, "up")} disabled={idx === 0}
                  className="cursor-pointer p-1 text-[#6B6A68] hover:text-[#D4D4D4] disabled:opacity-30">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleMove(s.id, "down")} disabled={idx === sorted.length - 1}
                  className="cursor-pointer p-1 text-[#6B6A68] hover:text-[#D4D4D4] disabled:opacity-30">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Toggle */}
            <button onClick={() => handleTogglePublic(s.id, s.is_public)}
              disabled={!s.logo_url && !s.is_public}
              className={`shrink-0 cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition disabled:opacity-40 disabled:cursor-not-allowed ${s.is_public ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400]/50 hover:text-[#F5C400]"}`}>
              {s.is_public ? "Publik ✓" : "Publik"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export { SponsorPublicAdminClient };
```

- [ ] **Step 2: Create admin/sponsor-control page**

Create `app/admin/(panel)/sponsor-control/page.tsx`:
```tsx
import { getSponsorsForAdmin } from "@/features/admin/queries";
import { SponsorPublicAdminClient } from "@/features/admin/components/SponsorPublicAdminClient";

export const dynamic = "force-dynamic";

const AdminSponsorControlPage = async () => {
  const sponsors = await getSponsorsForAdmin();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Sponsors Publik</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-10">
        <SponsorPublicAdminClient sponsors={sponsors} />
      </main>
    </>
  );
};
export { AdminSponsorControlPage as default };
```

- [ ] **Step 3: Create public /sponsors page**

Create `app/sponsors/page.tsx`:
```tsx
import type { Metadata } from "next";
import { Handshake } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { getPublicSponsors } from "@/features/admin/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sponsors — Hyperion Team",
  description: "Brand dan sponsor yang mendukung Hyperion Team.",
};

const SponsorsPage = async () => {
  const sponsors = await getPublicSponsors();
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        <section className="border-b border-white/12 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[#F5C400]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">Hyperion Team</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">Sponsors</h1>
            <p className="mt-3 text-sm text-white/55">Brand dan mitra yang mendukung perjalanan Hyperion Team.</p>
          </div>
        </section>
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {sponsors.length === 0 ? (
              <div className="border border-white/12 bg-[#071428] py-20 text-center">
                <Handshake className="mx-auto mb-4 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/45">Belum ada sponsor yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {sponsors.map((s) => (
                  <div key={s.id} className="flex items-center justify-center border border-white/10 bg-[#071428] p-6 transition hover:border-[#F5C400]/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logo_url} alt={s.name} className="max-h-16 w-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};
export { SponsorsPage as default };
```

- [ ] **Step 4: Add Sponsors to nav + sidebar**

In `components/landing/Header.tsx`, add Sponsors to DEFAULT_NAV (after Schedule, before Rekrutmen):
```ts
{ label: "Sponsors", href: "/sponsors" },
```

In `features/admin/components/AdminSidebarNav.tsx`, add `Handshake` to imports and to KONTEN LIST:
```tsx
import { ..., Handshake } from "lucide-react";
{ href: "/admin/sponsor-control", Icon: Handshake, label: "Sponsors Publik" },
```

- [ ] **Step 5: Run CI gate + commit**

```bash
npm run lint && npm run typecheck && npm run test:unit
git add features/admin/components/SponsorPublicAdminClient.tsx app/admin/\(panel\)/sponsor-control/page.tsx app/sponsors/page.tsx components/landing/Header.tsx features/admin/components/AdminSidebarNav.tsx
git commit -m "feat(admin-public): sponsor public admin UI + /sponsors page"
```

---

## Task 10: Player Visibility Queries + Actions + Tests

**Files:**
- Modify: `features/admin/queries.ts`
- Modify: `features/admin/actions.ts`
- Create: `features/admin/__tests__/player-public-actions.test.ts`

- [ ] **Step 1: Add player visibility queries**

Add to bottom of `features/admin/queries.ts`:
```ts
export type AdminPlayerMember = {
  id: string;
  user_id: string;
  role: string;
  position: string | null;
  jersey_number: number | null;
  division_id: string | null;
  division_name: string | null;
  is_public: boolean;
  display_name: string | null;
  avatar_url: string | null;
};

type RawMemberRow = {
  id: string;
  user_id: string;
  role: string;
  position: string | null;
  jersey_number: number | null;
  division_id: string | null;
  is_public: boolean;
  divisions: { name: string } | null;
};

export async function getMembersForAdmin(): Promise<AdminPlayerMember[]> {
  const admin = createAdminClient();
  const { data: members, error: memErr } = await admin
    .from("team_members")
    .select("id, user_id, role, position, jersey_number, division_id, is_public, divisions(name)")
    .eq("is_active", true)
    .order("role")
    .limit(200);
  if (memErr) console.error("getMembersForAdmin:", memErr);

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles, error: profErr } = await admin
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds)
      .limit(200);
    if (profErr) console.error("getMembersForAdmin profiles:", profErr);
    profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  }

  return ((members ?? []) as unknown as RawMemberRow[]).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    position: m.position,
    jersey_number: m.jersey_number,
    division_id: m.division_id,
    division_name: m.divisions?.name ?? null,
    is_public: m.is_public,
    display_name: profileMap.get(m.user_id)?.display_name ?? null,
    avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
  }));
}
```

- [ ] **Step 2: Add player visibility action**

Add to `features/admin/actions.ts`:
```ts
// ── Player Visibility ─────────────────────────────────────────────────────────

export async function togglePlayerPublicAction(
  memberId: string,
  nextValue: boolean
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members")
    .update({ is_public: nextValue })
    .eq("id", memberId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/divisions");
  revalidatePath("/admin/players");
  return { ok: true };
}
```

- [ ] **Step 3: Write player visibility action tests**

Create `features/admin/__tests__/player-public-actions.test.ts`:
```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { togglePlayerPublicAction } from "@/features/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

function mockClient(email: string) {
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { email } } }) } } as any;
}

beforeEach(() => { vi.clearAllMocks(); });

describe("togglePlayerPublicAction", () => {
  it("blocks non-admin", async () => {
    vi.mocked(createClient).mockResolvedValue(mockClient("other@x.com") as any);
    process.env.ADMIN_EMAIL = "admin@x.com";
    process.env.OWNER_EMAIL = "owner@x.com";
    const result = await togglePlayerPublicAction("member-id", true);
    expect(result.ok).toBe(false);
  });

  it("succeeds for admin", async () => {
    process.env.ADMIN_EMAIL = "admin@x.com";
    vi.mocked(createClient).mockResolvedValue(mockClient("admin@x.com") as any);
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ update: vi.fn().mockReturnValue({ eq: mockEq }) }) } as any);
    const result = await togglePlayerPublicAction("member-id", true);
    expect(result.ok).toBe(true);
  });
});
```

- [ ] **Step 4: Run tests + CI gate + commit**

```bash
npm run test:unit -- features/admin/__tests__/player-public-actions.test.ts
npm run lint && npm run typecheck && npm run test:unit
git add features/admin/queries.ts features/admin/actions.ts features/admin/__tests__/player-public-actions.test.ts
git commit -m "feat(admin-public): player visibility queries, action + tests"
```

---

## Task 11: Player Admin UI + Update Divisions Query

**Files:**
- Create: `features/admin/components/PlayersAdminClient.tsx`
- Create: `app/admin/(panel)/players/page.tsx`
- Modify: `features/admin/queries.ts` — update `getDivisionsWithMembers`

- [ ] **Step 1: Create PlayersAdminClient.tsx**

Create `features/admin/components/PlayersAdminClient.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { togglePlayerPublicAction } from "@/features/admin/actions";
import type { AdminPlayerMember } from "@/features/admin/queries";

interface Props { members: AdminPlayerMember[]; }

const ROLE_COLOR: Record<string, string> = {
  captain: "text-purple-400",
  coach: "text-blue-400",
  manager: "text-green-400",
  member: "text-[#9B9A97]",
};

const PlayersAdminClient = ({ members: initial }: Props) => {
  const [members, setMembers] = useState(initial);
  const [, startTransition] = useTransition();

  const handleToggle = (id: string, current: boolean) => {
    const next = !current;
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, is_public: next } : m));
    startTransition(async () => {
      const result = await togglePlayerPublicAction(id, next);
      if (!result.ok) {
        toast.error((result as { ok: false; message: string }).message);
        setMembers((prev) => prev.map((m) => m.id === id ? { ...m, is_public: current } : m));
      } else {
        toast.success(next ? "Player ditampilkan publik" : "Player disembunyikan dari publik");
      }
    });
  };

  // Group by division
  const grouped = members.reduce<Record<string, AdminPlayerMember[]>>((acc, m) => {
    const key = m.division_name ?? "Tanpa Divisi";
    return { ...acc, [key]: [...(acc[key] ?? []), m] };
  }, {});

  const publicCount = members.filter((m) => m.is_public).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Players Publik</h1>
        <p className="mt-1 text-xs text-[#6B6A68]">
          Kontrol siapa yang tampil di halaman publik <span className="text-white/50">/divisions</span>.
          Bio dan social links dikelola sendiri oleh player di workspace.
        </p>
        {publicCount > 0 && <p className="mt-1.5 text-xs font-semibold text-[#F5C400]">{publicCount} tampil publik</p>}
      </div>

      {members.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center border border-[#2D2D2D]">
          <Users className="h-8 w-8 text-[#2D2D2D]" />
          <p className="text-sm text-[#6B6A68]">Belum ada anggota aktif.</p>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(grouped).map(([division, divMembers]) => (
          <div key={division}>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">{division}</h2>
            <div className="space-y-1.5">
              {divMembers.map((m) => (
                <div key={m.id} className={`flex items-center gap-4 rounded border px-4 py-3 transition ${m.is_public ? "border-[#F5C400]/30 bg-[#1a1800]" : "border-[#2D2D2D] bg-[#141414]"}`}>
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-xs font-bold text-[#6B6A68]">
                      {(m.display_name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#D4D4D4]">
                      {m.display_name ?? <span className="text-[#6B6A68]">Unnamed</span>}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-medium capitalize ${ROLE_COLOR[m.role] ?? "text-[#6B6A68]"}`}>{m.role}</span>
                      {m.position && <span className="text-[#6B6A68]">· {m.position}</span>}
                      {m.jersey_number != null && <span className="text-[#6B6A68]">· #{m.jersey_number}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleToggle(m.id, m.is_public)}
                    className={`shrink-0 cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition ${m.is_public ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400]/50 hover:text-[#F5C400]"}`}>
                    {m.is_public ? "Publik ✓" : "Publik"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export { PlayersAdminClient };
```

- [ ] **Step 2: Create admin/players page**

Create `app/admin/(panel)/players/page.tsx`:
```tsx
import { getMembersForAdmin } from "@/features/admin/queries";
import { PlayersAdminClient } from "@/features/admin/components/PlayersAdminClient";

export const dynamic = "force-dynamic";

const AdminPlayersPage = async () => {
  const members = await getMembersForAdmin();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Players Publik</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-10">
        <PlayersAdminClient members={members} />
      </main>
    </>
  );
};
export { AdminPlayersPage as default };
```

- [ ] **Step 3: Update getDivisionsWithMembers to filter is_public**

In `features/admin/queries.ts`, find the `getDivisionsWithMembers` function. Update the team_members query to add `.eq("is_public", true)`:

Find this line:
```ts
    .in("role", ["captain", "member", "coach"])
    .eq("is_active", true)
```
Change to:
```ts
    .in("role", ["captain", "member", "coach"])
    .eq("is_active", true)
    .eq("is_public", true)
```

- [ ] **Step 4: Add Players to AdminSidebarNav**

In `features/admin/components/AdminSidebarNav.tsx`, add `Users` to imports and to KONTEN LIST:
```tsx
// Users is already imported — just add the nav item
{ href: "/admin/players", Icon: Users, label: "Players Publik" },
```

- [ ] **Step 5: Run CI gate + commit**

```bash
npm run lint && npm run typecheck && npm run test:unit
git add features/admin/components/PlayersAdminClient.tsx app/admin/\(panel\)/players/page.tsx features/admin/queries.ts features/admin/components/AdminSidebarNav.tsx
git commit -m "feat(admin-public): player visibility admin UI + update divisions public filter"
```

---

## Task 12: Final Push + Smoke Check

- [ ] **Step 1: Push all commits**

```bash
git push
```

- [ ] **Step 2: Verify admin sidebar has all 4 new entries**

Open `/admin`. Confirm KONTEN LIST shows: Gallery, Achievements, **News**, Tournaments & Schedule, **Results**, Partners, Testimonials, Divisions, **Sponsors Publik**, **Players Publik**.

- [ ] **Step 3: Verify public routes load**

Navigate to `/news`, `/results`, `/sponsors`. All should load with empty states (no 500 errors).

- [ ] **Step 4: Verify /divisions still works**

Navigate to `/divisions`. It should load (may show fewer or no players if none have `is_public = true` yet — that's correct behavior).

- [ ] **Step 5: End-to-end smoke test — News**

1. Go to `/admin/news` → create article with title "Test Artikel" → status Published → save
2. Go to `/news` → article should appear
3. Click article → `/news/test-artikel` → content visible
4. Return to admin → toggle to Draft → reload `/news` → article gone

- [ ] **Step 6: End-to-end smoke test — Results**

1. Manager must have completed a tournament first. If none exists, skip.
2. Go to `/admin/results` → upload a photo → toggle Publik
3. Go to `/results` → card with photo should appear

- [ ] **Step 7: End-to-end smoke test — Sponsors**

1. Go to `/admin/sponsor-control` → toggle a sponsor with logo to Publik
2. Go to `/sponsors` → logo should appear

- [ ] **Step 8: End-to-end smoke test — Players**

1. Go to `/admin/players` → toggle a player to Publik
2. Go to `/divisions` → player should appear in their division
