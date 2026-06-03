import { redirect } from "next/navigation";

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
} from "@/features/admin/queries";
import type { HeroSlide, HeroSettings } from "@/components/landing/HeroSection";

export const dynamic = "force-dynamic";

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

  const [galleryEntries, manualAchievements, partners, testimonials, settings] = await Promise.all([
    getGalleryEntries(),
    getPublicAchievements(),
    getActivePartners(),
    getActiveTestimonials(),
    getSiteSettings(),
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
  }));
  // Merge: manual achievements first, then gallery entries not already covered by title
  const manualTitles = new Set(manualAchievements.map((a) => a.title));
  const mergedAchievements = [
    ...manualAchievements,
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

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection slides={heroSlides} settings={heroSettings} />
        <DivisionsSection />
        <AchievementsSection entries={mergedAchievements} />
        <TestimonialsSection testimonials={testimonials} />
        <PartnersSection partners={partners} />
        <JoinUsSection settings={joinSettings} />
      </main>
      <Footer settings={footerSettings} />
    </>
  );
}
