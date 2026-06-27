import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type GalleryEntry = Database["public"]["Tables"]["gallery_entries"]["Row"];
export type Partner = Database["public"]["Tables"]["partners"]["Row"];
export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
export type DivisionPublic = Database["public"]["Tables"]["divisions_public"]["Row"];
export type SiteSetting = Database["public"]["Tables"]["site_settings"]["Row"];

export type DivisionMember = {
  id: string;
  user_id: string;
  role: string;
  position: string | null;
  jersey_number: number | null;
  display_name: string | null;
  avatar_url: string | null;
  is_public: boolean;
};

export type DivisionAchievement = {
  id: string;
  title: string;
  placement: number | null;
  tournament_date: string;
  description: string;
  organization_id: string | null;
  division_id: string | null;
};

export type DivisionWithMembers = {
  id: string;
  name: string;
  game: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  is_public: boolean;
  organization_id: string | null;
  members: DivisionMember[];
  achievements: DivisionAchievement[];
};

export async function getDivisionsWithMembers(): Promise<DivisionWithMembers[]> {
  const admin = createAdminClient();

  const { data: divisions, error: divErr } = await admin
    .from("divisions")
    .select("id, name, game, description, logo_url, is_active, is_public, organization_id")
    .order("name")
    .limit(50);
  if (divErr) console.error("getDivisionsWithMembers divisions:", divErr);
  if (!divisions || divisions.length === 0) return [];

  const divisionIds = divisions.map((d) => d.id);

  const { data: members, error: memErr } = await admin
    .from("team_members")
    .select("id, user_id, role, position, jersey_number, division_id, is_public")
    .in("division_id", divisionIds)
    .in("role", ["captain", "member", "coach"])
    .eq("is_active", true)
    .limit(500);
  if (memErr) console.error("getDivisionsWithMembers members:", memErr);

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles, error: profErr } = await admin
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds)
      .limit(500);
    if (profErr) console.error("getDivisionsWithMembers profiles:", profErr);
    profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  }

  const orgIds = divisions.map((d) => d.organization_id).filter(Boolean) as string[];
  const achievementsMap = new Map<string, DivisionAchievement[]>();

  if (orgIds.length > 0) {
    const { data: achievements, error: achErr } = await admin
      .from("gallery_entries")
      .select("id, title, placement, tournament_date, description, organization_id, division_id")
      .in("organization_id", orgIds)
      .order("tournament_date", { ascending: false })
      .limit(100);
    if (achErr) console.error("getDivisionsWithMembers achievements:", achErr);

    for (const ach of achievements ?? []) {
      if (ach.organization_id) {
        const list = achievementsMap.get(ach.organization_id) ?? [];
        list.push({
          id: ach.id,
          title: ach.title,
          placement: ach.placement,
          tournament_date: ach.tournament_date,
          description: ach.description ?? "",
          organization_id: ach.organization_id,
          division_id: ach.division_id,
        });
        achievementsMap.set(ach.organization_id, list);
      }
    }
  }

  return divisions
    .map((div) => {
      const divMembers = (members ?? [])
        .filter((m) => m.division_id === div.id)
        .map((m) => {
          const profile = profileMap.get(m.user_id);
          return {
            id: m.id,
            user_id: m.user_id,
            role: m.role,
            position: m.position,
            jersey_number: m.jersey_number,
            display_name: profile?.display_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
            is_public: m.is_public,
          };
        });
      const divAchievements = div.organization_id ? (achievementsMap.get(div.organization_id) ?? []) : [];
      return { ...div, members: divMembers, achievements: divAchievements };
    })
    .filter((div) => div.members.length > 0);
}

export async function getGalleryEntries(): Promise<GalleryEntry[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gallery_entries")
    .select("*")
    .order("sort_order")
    .limit(50);
  if (error) console.error("getGalleryEntries:", error);
  return data ?? [];
}

export async function getGalleryEntryBySlug(slug: string): Promise<GalleryEntry | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gallery_entries")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) console.error("getGalleryEntryBySlug:", error);
  return data ?? null;
}

export async function getPartners(): Promise<Partner[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("partners")
    .select("*")
    .order("sort_order")
    .limit(50);
  if (error) console.error("getPartners:", error);
  return data ?? [];
}

export async function getActivePartners(): Promise<Partner[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("partners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(50);
  if (error) console.error("getActivePartners:", error);
  return data ?? [];
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("testimonials")
    .select("*")
    .order("sort_order")
    .limit(50);
  if (error) console.error("getTestimonials:", error);
  return data ?? [];
}

export async function getActiveTestimonials(): Promise<Testimonial[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(50);
  if (error) console.error("getActiveTestimonials:", error);
  return data ?? [];
}

export async function getDivisionsPublic(): Promise<DivisionPublic[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("divisions_public")
    .select("*")
    .order("sort_order")
    .limit(50);
  if (error) console.error("getDivisionsPublic:", error);
  return data ?? [];
}

export async function getActiveDivisionsPublic(): Promise<DivisionPublic[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("divisions_public")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(50);
  if (error) console.error("getActiveDivisionsPublic:", error);
  return data ?? [];
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("key, value")
    .limit(100);
  if (error) console.error("getSiteSettings:", error);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return map;
}



export type AboutAlumnus = {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
};

export async function getAboutAlumni(): Promise<AboutAlumnus[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("about_alumni")
    .select("id, name, role, image_url, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .limit(30);
  if (error) console.error("getAboutAlumni:", error);
  return (data ?? []) as AboutAlumnus[];
}

export type AdminTournament = {
  id: string;
  name: string;
  start_date: string;
  start_time: string | null;
  show_in_hero: boolean;
  show_on_schedule: boolean;
  status: string;
  division_id: string;
};

export type FeaturedTournament = {
  id: string;
  name: string;
  start_date: string;
  start_time: string | null;
};

export type PublicTournament = {
  id: string;
  name: string;
  start_date: string;
  start_time: string | null;
  status: string;
  organizer: string | null;
  prize_pool: string | null;
  registration_url: string | null;
  division_name: string | null;
  game: string | null;
};

export async function getTournamentsForAdmin(): Promise<AdminTournament[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time, show_in_hero, show_on_schedule, status, division_id")
    .eq("is_registered", true)
    .in("status", ["upcoming", "ongoing"])
    .gte("start_date", todayISO())
    .order("start_date", { ascending: true })
    .limit(50);
  if (error) console.error("getTournamentsForAdmin:", error);
  return (data ?? []) as AdminTournament[];
}

export async function getFeaturedTournaments(): Promise<FeaturedTournament[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time")
    .eq("show_in_hero", true)
    .order("start_date", { ascending: true })
    .limit(5);
  if (error) console.error("getFeaturedTournaments:", error);
  return (data ?? []) as FeaturedTournament[];
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type RawPublicRow = {
  id: string;
  name: string;
  start_date: string;
  start_time: string | null;
  status: string;
  organizer: string | null;
  prize_pool: string | null;
  registration_url: string | null;
  divisions: { name: string; game: string | null } | null;
};

function mapPublicRow(row: RawPublicRow): PublicTournament {
  return {
    id: row.id,
    name: row.name,
    start_date: row.start_date,
    start_time: row.start_time,
    status: row.status,
    organizer: row.organizer,
    prize_pool: row.prize_pool,
    registration_url: row.registration_url,
    division_name: row.divisions?.name ?? null,
    game: row.divisions?.game ?? null,
  };
}

export async function getScheduleTournaments(): Promise<PublicTournament[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time, status, organizer, prize_pool, registration_url, divisions(name, game)")
    .eq("show_on_schedule", true)
    .eq("is_registered", true)
    .in("status", ["upcoming", "ongoing"])
    .gte("start_date", todayISO())
    .order("start_date", { ascending: true })
    .limit(50);
  if (error) console.error("getScheduleTournaments:", error);
  return ((data ?? []) as unknown as RawPublicRow[]).map(mapPublicRow);
}

export async function getUpcomingPublicTournaments(limit = 3): Promise<PublicTournament[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time, status, organizer, prize_pool, registration_url, divisions(name, game)")
    .eq("show_on_schedule", true)
    .eq("is_registered", true)
    .in("status", ["upcoming", "ongoing"])
    .gte("start_date", todayISO())
    .order("start_date", { ascending: true })
    .limit(limit);
  if (error) console.error("getUpcomingPublicTournaments:", error);
  return ((data ?? []) as unknown as RawPublicRow[]).map(mapPublicRow);
}

export async function getNearestPublicTournament(): Promise<PublicTournament | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tournaments")
    .select("id, name, start_date, start_time, status, organizer, prize_pool, registration_url, divisions(name, game)")
    .eq("show_on_schedule", true)
    .eq("is_registered", true)
    .in("status", ["upcoming", "ongoing"])
    .gte("start_date", todayISO())
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) console.error("getNearestPublicTournament:", error);
  if (!data) return null;
  return mapPublicRow(data as unknown as RawPublicRow);
}

// ── News CMS ──────────────────────────────────────────────────────────────────

export type NewsPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  updated_at: string;
  created_at: string;
  category: string | null;
  read_time: number | null;
};

export async function getNewsPosts(): Promise<NewsPost[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("news_posts")
    .select("id, title, slug, excerpt, content, cover_image_url, status, published_at, updated_at, created_at, category, read_time")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("getNewsPosts:", error);
  return (data ?? []) as NewsPost[];
}

export async function getPublishedNewsPosts(): Promise<NewsPost[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("news_posts")
    .select("id, title, slug, excerpt, cover_image_url, published_at, updated_at, created_at, content, status, category, read_time")
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
    .select("id, title, slug, excerpt, content, cover_image_url, status, published_at, updated_at, created_at, category, read_time")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) console.error("getNewsPostBySlug:", error);
  return data as NewsPost | null;
}

// ── Results ───────────────────────────────────────────────────────────────────

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

// ── Sponsors ──────────────────────────────────────────────────────────────────

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

// ── Player Visibility ─────────────────────────────────────────────────────────

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

export type PublicScrim = {
  id: string;
  opponent_name: string;
  scheduled_at: string;
  status: string;
  format: string;
};

export async function getNearestPublicScrim(): Promise<PublicScrim | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scrims")
    .select("id, opponent_name, scheduled_at, status, format")
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("getNearestPublicScrim:", error);
    return null;
  }
  return data;
}
