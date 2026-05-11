import { AchievementsSection } from "@/components/landing/AchievementsSection";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { JoinUsSection } from "@/components/landing/JoinUsSection";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

// SSR per spec — Header reads the auth cookie via createClient(), which
// already opts the route into dynamic rendering, but we set the flag
// explicitly so the intent is obvious to readers and so the build cache
// can't accidentally upgrade this back to static.
export const dynamic = "force-dynamic";

export default function HomePage() {
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
