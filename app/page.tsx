import { redirect } from "next/navigation";

import { AchievementsSection } from "@/components/landing/AchievementsSection";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { JoinUsSection } from "@/components/landing/JoinUsSection";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AchievementsSection />
        <TestimonialsSection />
        <PartnersSection />
        <JoinUsSection />
      </main>
      <Footer />
    </>
  );
}
