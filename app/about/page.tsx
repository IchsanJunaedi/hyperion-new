import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { AboutImageMarquee } from "@/components/landing/AboutImageMarquee";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { getSiteSettings, getAboutAlumni } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.seo_about_title || "Tentang Kami — Hyperion Team",
    description: settings.seo_about_description || "Pelajari lebih lanjut tentang Hyperion Team, organisasi esports yang berdedikasi untuk memberdayakan talenta muda Indonesia.",
  };
}

export default async function AboutPage() {
  const [settings, alumni] = await Promise.all([getSiteSettings(), getAboutAlumni()]);

  const cards = [
    {
      title: settings.about_vision_title || "Our Vision",
      body: settings.about_vision_body || "Menjadi organisasi esports terdepan yang melahirkan generasi pemain profesional, membuktikan bahwa talenta muda Indonesia mampu bersaing di panggung nasional dan internasional.",
    },
    {
      title: settings.about_mission_title || "Our Mission",
      body: settings.about_mission_body || "Mengembangkan bakat muda melalui program pelatihan komprehensif, kompetisi rutin, dan mentoring dari para profesional — membangun fondasi karir esports yang kuat sejak dini.",
    },
    {
      title: settings.about_values_title || "Our Values",
      body: settings.about_values_body || "Integritas dalam setiap pertandingan, semangat untuk terus berkembang, dan kebersamaan sebagai satu tim yang solid. Kami percaya kemenangan sejati dibangun di luar arena.",
    },
  ];

  const teamMembers = alumni.length > 0 ? alumni : [
    { id: "1", name: "RRQ Kaeya", role: "Alumni · Player", image_url: "https://hyperionteam.id/storage/testimonials/01K2SMTH386QV9Q3R8PTF7913YR.png", sort_order: 0, created_at: "" },
    { id: "2", name: "Evos Rendyy", role: "Alumni · Player", image_url: "https://hyperionteam.id/storage/testimonials/01K2RYQS6A36J458VGK7DE8AS9.png", sort_order: 1, created_at: "" },
    { id: "3", name: "Pajajaran Firlyboy", role: "Alumni · Player", image_url: "https://hyperionteam.id/storage/testimonials/01K2RYVPWSFF8GGREVCD4VKRRH.png", sort_order: 2, created_at: "" },
  ];
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#040D1C]">
        {/* Hero Banner */}
        <section className="mx-auto max-w-7xl px-4 pt-12 md:pt-20">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/12">
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
            <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
              <Image src="/brand/logo.jpg" alt="Hyperion Team" width={96} height={96} className="mb-6 h-20 w-20 rounded-xl object-cover sm:h-24 sm:w-24" />
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">Est. 2020 · Palembang, Indonesia</p>
              <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">About Hyperion Team</h1>
            </div>
          </div>
        </section>

        {/* First description */}
        <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <p className="text-2xl font-bold leading-snug tracking-tight text-white/80 md:text-4xl">
            Hyperion Team adalah{" "}<span className="text-[#F5C400]">organisasi esports</span>{" "}yang berdedikasi untuk memberdayakan talenta muda Indonesia. Kami percaya setiap pemain muda memiliki potensi luar biasa yang menunggu untuk dikembangkan.
          </p>
        </section>

        <AboutImageMarquee />

        {/* Second description */}
        <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <p className="text-2xl font-bold leading-snug tracking-tight text-white/80 md:text-4xl">
            Sejak 2020, kami telah melahirkan puluhan pemain yang kini berkarir di tim-tim profesional nasional. Perjalanan kami adalah bukti bahwa{" "}<span className="text-[#F5C400]">kerja keras dan sistem yang tepat</span>{" "}mengubah mimpi menjadi kenyataan.
          </p>
        </section>

        {/* Vision / Mission / Values */}
        <section className="px-6 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#0C1E3C" }}
              >
                <h3 className="mb-4 text-xl font-bold text-[#F5C400]">{card.title}</h3>
                <p className="text-justify leading-relaxed text-white/70">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Meet our team */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px w-8 bg-[#F5C400]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
                  Alumni
                </span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                Meet Our Team
              </h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 [scrollbar-width:none]">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="relative h-80 w-56 shrink-0 overflow-hidden rounded-xl shadow-md sm:h-96 sm:w-64"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.image_url ?? ""}
                    alt={member.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#040D1C]/90 to-transparent p-5">
                    <p className="text-2xl font-bold tracking-wide text-white">
                      {member.name}
                    </p>
                    <p className="text-sm text-white/70">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-24 pt-8 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl border-t border-white/12 pt-12 text-center">
            <p className="text-sm text-white/40">Tertarik bergabung?{" "}<Link href="/#join" className="text-[#F5C400] hover:underline">Lihat kesempatan bergabung →</Link></p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
