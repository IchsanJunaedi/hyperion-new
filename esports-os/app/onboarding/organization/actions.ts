"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidSlug, slugify } from "@/lib/utils/slug";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
  type SupportedGame,
} from "@/lib/validations/onboarding";

export interface CreateOrgResult {
  error?: string;
}

export interface SlugAvailabilityResult {
  available: boolean;
  reason?: string;
}

const RESERVED_SLUGS = new Set([
  "login",
  "register",
  "callback",
  "invite",
  "auth",
  "onboarding",
  "api",
  "_next",
  "settings",
  "admin",
  "dashboard",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
  "www",
]);

export async function checkSlugAvailability(
  slug: string,
): Promise<SlugAvailabilityResult> {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) {
    return { available: false, reason: "Slug wajib diisi" };
  }
  if (!isValidSlug(trimmed)) {
    return {
      available: false,
      reason:
        "Slug harus 3–32 karakter, huruf kecil, angka, dan tanda hubung saja.",
    };
  }
  if (RESERVED_SLUGS.has(trimmed)) {
    return { available: false, reason: "Slug ini dipakai sistem." };
  }

  // Use the admin client so visitors-without-session can still get
  // realtime feedback (the public RLS read is fine for slug taken/not,
  // but we want to also catch private-org slug collisions).
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", trimmed)
    .maybeSingle();

  if (error) {
    return { available: false, reason: error.message };
  }
  if (data) {
    return { available: false, reason: "Slug sudah dipakai tim lain." };
  }
  return { available: true };
}

export async function createOrganizationAction(
  input: CreateOrganizationInput,
): Promise<CreateOrgResult> {
  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Input tidak valid" };
  }

  const slug = parsed.data.slug;
  if (RESERVED_SLUGS.has(slug)) {
    return { error: "Slug ini dipakai sistem. Pilih slug lain." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesi kamu sudah berakhir. Silakan masuk lagi." };
  }

  // Use service-role client to insert the org + first owner row in one
  // logical step. Without elevated privileges, the RLS policies on
  // `team_members` would block the very first insert (since no row yet
  // exists making the user a member of this org).
  const admin = createAdminClient();

  const { data: orgRow, error: orgErr } = await admin
    .from("organizations")
    .insert({
      name: parsed.data.name,
      slug,
      tier: parsed.data.tier,
      owner_id: user.id,
    })
    .select("id, slug")
    .single();

  if (orgErr || !orgRow) {
    if (orgErr?.code === "23505") {
      return { error: "Slug sudah dipakai tim lain. Pilih slug lain." };
    }
    return { error: orgErr?.message ?? "Gagal membuat tim." };
  }

  const divisionRows = parsed.data.divisions.map((div) => ({
    organization_id: orgRow.id,
    name: div.name,
    slug: slugify(div.name),
    game: gameToSlug(div.game),
  }));

  const { data: insertedDivisions, error: divErr } = await admin
    .from("divisions")
    .insert(divisionRows)
    .select("id");

  if (divErr) {
    await admin.from("organizations").delete().eq("id", orgRow.id);
    return { error: divErr.message };
  }

  const ownerInserts = (insertedDivisions ?? []).map((division) => ({
    organization_id: orgRow.id,
    division_id: division.id,
    user_id: user.id,
    role: "owner" as const,
  }));

  if (ownerInserts.length === 0) {
    ownerInserts.push({
      organization_id: orgRow.id,
      division_id: null as unknown as string,
      user_id: user.id,
      role: "owner",
    });
  }

  const { error: memberErr } = await admin
    .from("team_members")
    .insert(ownerInserts);

  if (memberErr) {
    await admin.from("organizations").delete().eq("id", orgRow.id);
    return { error: memberErr.message };
  }

  // Force JWT refresh so the new `app_metadata.organizations` claim is
  // picked up by the next request (middleware-driven workspace gating).
  await supabase.auth.refreshSession();

  redirect(`/${orgRow.slug}`);
}

function gameToSlug(game: SupportedGame): string {
  return game;
}
