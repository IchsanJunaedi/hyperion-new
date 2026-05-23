import Image from "next/image";
import Link from "next/link";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";

export const dynamic = "force-dynamic";

const CARDS = [
  {
    title: "Our Vision",
    body: "Menjadi organisasi esports terdepan yang melahirkan generasi pemain profesional, membuktikan bahwa talenta muda Indonesia mampu bersaing di panggung nasional dan internasional.",
  },
  {
    title: "Our Mission",
    body: "Mengembangkan bakat muda melalui program pelatihan komprehensif, kompetisi rutin, dan mentoring dari para profesional — membangun fondasi karir esports yang kuat sejak dini.",
  },
  {
    title: "Our Values",
    body: "Integritas dalam setiap pertandingan, semangat untuk terus berkembang, dan kebersamaan sebagai satu tim yang solid. Kami percaya kemenangan sejati dibangun di luar arena.",
  },
];

const TEAM_MEMBERS = [
  {
    name: "RRQ Kaeya",
    role: "Alumni · Player",
    image:
      "https://hyperionteam.id/storage/testimonials/01K2SMTH386QV9Q3R8PTF7913YR.png",
  },
  {
    name: "Evos Rendyy",
    role: "Alumni · Player",
    image:
      "https://hyperionteam.id/storage/testimonials/01K2RYQS6A36J458VGK7DE8AS9.png",
  },
  {
    name: "Pajajaran Firlyboy",
    role: "Alumni · Player",
    image:
      "https://hyperionteam.id/storage/testimonials/01K2RYVPWSFF8GGREVCD4VKRRH.png",
  },
];

const PARALLAX_IMAGES = [
  "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
  "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
  "https://hyperionteam.id/storage/timelines/01JZPD3RM26KW2BNB68WFYTT6X.jpeg",
  "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
  "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#070707]">
        {/* Hero Banner */}
        <section className="mx-auto max-w-7xl px-4 pt-12 md:pt-20">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(245,196,0,0.12) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
              <Image
                src="/brand/logo.jpg"
                alt="Hyperion Team"
                width={96}
                height={96}
                className="mb-6 h-20 w-20 rounded-xl object-cover sm:h-24 sm:w-24"
              />
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#F5C400]">
                Est. 2020 · Palembang, Indonesia
              </p>
              <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                About Hyperion Team
              </h1>
            </div>
          </div>
        </section>

        {/* First description */}
        <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <p className="text-2xl font-bold leading-snug tracking-tight text-white/80 md:text-4xl">
            Hyperion Team adalah{" "}
            <span className="text-[#F5C400]">
              organisasi esports
            </span>{" "}
            yang berdedikasi untuk memberdayakan talenta muda Indonesia. Kami percaya
            setiap pemain muda memiliki potensi luar biasa yang menunggu untuk
            dikembangkan.
          </p>
        </section>

        {/* Image rows (static scroll gallery) */}
        <section className="overflow-hidden py-8 md:py-12">
          <div className="flex gap-4 overflow-x-auto pb-4 pl-6 sm:pl-10 lg:pl-16 [scrollbar-width:none]">
            {PARALLAX_IMAGES.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`Hyperion moment ${i + 1}`}
                loading="lazy"
                className="h-44 w-72 shrink-0 rounded-xl object-cover shadow-md sm:h-52 sm:w-80"
              />
            ))}
          </div>
        </section>

        {/* Second description */}
        <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <p className="text-2xl font-bold leading-snug tracking-tight text-white/80 md:text-4xl">
            Sejak 2020, kami telah melahirkan puluhan pemain yang kini berkarir di tim-tim
            profesional nasional. Perjalanan kami adalah bukti bahwa{" "}
            <span className="text-[#F5C400]">kerja keras dan sistem yang tepat</span>{" "}
            mengubah mimpi menjadi kenyataan.
          </p>
        </section>

        {/* Vision / Mission / Values cards */}
        <section className="px-6 py-12 sm:px-10 lg:px-16">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
            {CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#2E2E2E" }}
              >
                <h3 className="mb-4 text-xl font-bold text-[#F5C400]">{card.title}</h3>
                <p className="text-justify text-gray-300 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Meet our team */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
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
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 [scrollbar-width:none]">
              {TEAM_MEMBERS.map((member) => (
                <div
                  key={member.name}
                  className="relative h-80 w-56 shrink-0 overflow-hidden rounded-xl shadow-md sm:h-96 sm:w-64"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-5">
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
          <div className="mx-auto max-w-7xl border-t border-white/5 pt-12 text-center">
            <p className="text-sm text-white/40">
              Tertarik bergabung?{" "}
              <Link href="/#join" className="text-[#F5C400] hover:underline">
                Lihat kesempatan bergabung →
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
