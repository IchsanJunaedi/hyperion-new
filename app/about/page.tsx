import type { Metadata } from "next";

import { Header } from "@/components/landing/Header";
import { getSiteSettings, getAboutAlumni } from "@/features/admin/queries";
import { AboutClient } from "./AboutClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.seo_about_title || "Tentang Kami — Hyperion Team",
    description: settings.seo_about_description || "Pelajari lebih lanjut tentang Hyperion Team, organisasi esports yang berdedikasi untuk memberdayakan talenta muda Indonesia.",
  };
}

const AboutPage = async () => {
  const [settings, alumni] = await Promise.all([getSiteSettings(), getAboutAlumni()]);

  return (
    <>
      <Header />
      <main className="flex flex-col min-h-screen bg-[#040D1C]">
        <AboutClient settings={settings} alumni={alumni} />
      </main>
    </>
  );
};

export { AboutPage as default };

