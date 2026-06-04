import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AchievementsSection } from "@/components/landing/AchievementsSection";
import { DivisionsSection } from "@/components/landing/DivisionsSection";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { JoinUsSection } from "@/components/landing/JoinUsSection";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { createClient } from "@/lib/supabase/server";
import {
  getGalleryEntries,
  getPublicAchievements,
  getActivePartners,
  getActiveTestimonials,
  getSiteSettings,
  getFeaturedTournaments,
  getUpcomingPublicTournaments,
  getNearestPublicTournament,
  getPublishedNewsPosts,
} from "@/features/admin/queries";
import { UpcomingMatchesSection } from "@/components/landing/UpcomingMatchesSection";
import { LatestNewsSection } from "@/components/landing/LatestNewsSection";
import type { PublicTournament } from "@/features/admin/queries";
import type { HeroSlide, HeroSettings } from "@/components/landing/HeroSection";

const DUMMY_UPCOMING: PublicTournament[] = [
  { id: "dummy-1", name: "MPL Indonesia Season 15", start_date: "2026-07-10", start_time: "18:00:00", status: "upcoming", organizer: "Moonton", prize_pool: "IDR 2.000.000.000", registration_url: null, division_name: "Mobile Legends", game: "MLBB" },
  { id: "dummy-2", name: "Hyperion Internal Cup", start_date: "2026-06-20", start_time: "15:00:00", status: "upcoming", organizer: null, prize_pool: null, registration_url: null, division_name: "Mobile Legends", game: "MLBB" },
  { id: "dummy-3", name: "ESL Pro League Regional", start_date: "2026-08-05", start_time: "20:00:00", status: "upcoming", organizer: "ESL Gaming", prize_pool: "IDR 500.000.000", registration_url: null, division_name: null, game: "MLBB" },
];

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.seo_home_title || "Hyperion Team — Organisasi Esports Indonesia",
    description: settings.seo_home_description || "Platform manajemen tim esports profesional untuk Hyperion Team.",
    openGraph: settings.seo_og_image ? { images: [settings.seo_og_image] } : undefined,
  };
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auto-redirect logged-in users based on their role
  if (user) {
    // Owner check by email (env var)
    const ownerEmail = process.env.OWNER_EMAIL;
    if (ownerEmail && user.email === ownerEmail) {
      redirect("/dashboard");
    }

    const { data: memberships } = await supabase
      .from("team_members")
      .select("role, organization_id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (memberships && memberships.length > 0) {
      const roles = memberships.map((m) => m.role);

      if (roles.includes("manager")) {
        redirect("/manage");
      }

      // Coach, Captain, Member → workspace
      const firstMembership = memberships[0];
      if (firstMembership) {
        const { data: org } = await supabase
          .from("organizations")
          .select("slug")
          .eq("id", firstMembership.organization_id)
          .maybeSingle();
        if (org?.slug) {
          redirect(`/${org.slug}`);
        }
      }
    }

    // User logged in but no membership → check if onboarding is incomplete
    // Resume onboarding checkpoint so a crash mid-flow sends them back to the right step
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.username) {
      redirect("/onboarding/profile");
    }
  }

  const [galleryEntries, manualAchievements, partners, testimonials, settings, featuredTournaments, upcomingMatches, nearestTournament, latestNews] =
    await Promise.all([
      getGalleryEntries(),
      getPublicAchievements(),
      getActivePartners(),
      getActiveTestimonials(),
      getSiteSettings(),
      getFeaturedTournaments(),
      getUpcomingPublicTournaments(3),
      getNearestPublicTournament(),
      getPublishedNewsPosts(),
    ]);

  const heroSlides: HeroSlide[] = galleryEntries.slice(0, 3).map((e) => ({
    image: e.preview_images[0] ?? "",
    achievement: e.title,
    rank: e.position,
    year: e.tournament_date,
  }));

  // Manual achievements (from /admin/achievements) take priority.
  // Fall back to gallery_entries mapped to Achievement shape if no manual entries exist.
  function parsePlacement(position: string): number | null {
    if (/#?1\b/i.test(position) || /champion/i.test(position)) return 1;
    if (/#?2\b/i.test(position)) return 2;
    if (/#?3\b/i.test(position)) return 3;
    return null;
  }
  const galleryAsAchievements = galleryEntries.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description ?? null,
    placement: parsePlacement(e.position ?? ""),
    achieved_at: e.tournament_date ?? "",
    image_url: e.preview_images[0] ?? e.logo_url ?? null,
    organization_id: null,
    division_id: null,
    tournament_id: null,
    created_at: "",
    href: `/gallery/${e.slug}`,
  }));
  // Merge: manual achievements first, then gallery entries not already covered by title
  const manualTitles = new Set(manualAchievements.map((a) => a.title));
  const mergedAchievements = [
    ...manualAchievements.map((a) => ({ ...a, href: "/gallery" })),
    ...galleryAsAchievements.filter((a) => !manualTitles.has(a.title)),
  ].sort((a, b) => b.achieved_at.localeCompare(a.achieved_at));

  const heroSettings: HeroSettings = {
    hero_eyebrow: settings.hero_eyebrow ?? "Est. 2020 — Palembang, Indonesia",
    hero_tagline: settings.hero_tagline ?? "Empowering Young Talents to Rise and Rule.",
    hero_cta_label: settings.hero_cta_label ?? "Join Us",
    hero_cta_href: settings.hero_cta_href ?? "/register",
  };

  const footerSettings = {
    footer_tagline:
      settings.footer_tagline ??
      "Empowering Young Talents to Rise and Rule. Est. 2020 — Palembang, Indonesia.",
    footer_instagram_handle: settings.footer_instagram_handle ?? "@hyperionteam.id",
    footer_instagram_url:
      settings.footer_instagram_url ?? "https://www.instagram.com/hyperionteam.id/",
    footer_hashtag: settings.footer_hashtag ?? "#HypeWin",
  };

  const joinSettings = {
    join_eyebrow: settings.join_eyebrow ?? "#HypeWin",
    join_title_line1: settings.join_title_line1 ?? "Ready To",
    join_title_line2: settings.join_title_line2 ?? "Join The Team?",
    join_description:
      settings.join_description ??
      "Unleash your potential. Kembangkan skill, bangun karir esports, dan jadilah bagian dari keluarga Hyperion Team.",
    join_fine_print: settings.join_fine_print ?? "Gratis · Tanpa syarat umur minimum",
  };

  const heroTournaments = nearestTournament
    ? [{ id: nearestTournament.id, name: nearestTournament.name, start_date: nearestTournament.start_date, start_time: nearestTournament.start_time }]
    : featuredTournaments;

  const displayUpcoming = upcomingMatches.length > 0 ? upcomingMatches : DUMMY_UPCOMING;

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection
          slides={heroSlides}
          settings={heroSettings}
          featuredTournaments={heroTournaments}
          heroBackground={settings.hero_background_url || null}
        />
        <UpcomingMatchesSection tournaments={displayUpcoming} />
        <DivisionsSection />
        <AchievementsSection entries={mergedAchievements} />
        <LatestNewsSection posts={latestNews.slice(0, 3)} />
        <TestimonialsSection testimonials={testimonials} />
        <PartnersSection partners={partners} />
        <JoinUsSection settings={joinSettings} />
      </main>
      <Footer settings={footerSettings} />
    </>
  );
}
