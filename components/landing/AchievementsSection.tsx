import Image from "next/image";
import Link from "next/link";

interface Achievement {
  title: string;
  description: string;
  imageUrl: string;
  ctaHref?: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    title: "Juara 1 Liga Esport Nasional Pelajar 2024",
    description:
      "Ini dia SANG JUARA LIGA ESPORTS NASIONAL PELAJAR 2024 - MOBILE LEGENDS. Perjuangan keras tidak mengkhianati hasil dari kerjasama tim. Tetap semangat dan semoga bisa terus mendapatkan juara.",
    imageUrl:
      "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
  },
  {
    title: "Champion RRQ MABAR Esports Tournament Season 4",
    description:
      "Ribuan pelajar telah bertanding di RRQ MABAR Esports Tournament Season 4 dan inilah juaranya! SMAS Xaverius 1 Palembang berhasil raih back to back champion setelah menang 3-1 di Grand Final melawan SMAK Yos Sudarso Batam.",
    imageUrl:
      "https://hyperionteam.id/storage/timelines/01JZPD3B2P75DVSJT6N1609AM3.jpeg",
  },
  {
    title: "Champion H3RO ROOKIE TOURNAMENT 4.0",
    description:
      "H3RO Esports 4.0 is the 4th edition of the event organized by H3RO. Champion qualifies to Seleknas IESF 2023.",
    imageUrl:
      "https://hyperionteam.id/storage/timelines/01JZPD3RM26KW2BNB68WFYTT6X.jpeg",
  },
];

export function AchievementsSection() {
  return (
    <section
      id="achievements"
      className="bg-[#080808] px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-16">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px w-8 bg-[#F5C400]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
              Trophy Room
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
            OUR ACHIEVEMENTS
          </h2>
          <p className="mt-3 max-w-xl text-sm text-white/40">
            Perjalanan kami dimulai sejak 2020. Setiap trofi adalah bukti kerja keras seluruh tim.
          </p>
        </div>

        {/* Achievement items */}
        <div className="space-y-0">
          {ACHIEVEMENTS.map((a, i) => (
            <div
              key={a.title}
              className="group relative border-b border-white/5 py-10 first:border-t first:border-white/5"
            >
              {/* Index number */}
              <span
                className="pointer-events-none absolute -top-4 right-0 select-none text-[7rem] font-black leading-none text-white/[0.025]"
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-16">
                {/* Left: text */}
                <div>
                  {/* Yellow dot + title */}
                  <div className="flex items-start gap-4">
                    <div className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[#F5C400]" />
                    <h3 className="text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">
                      {a.title}
                    </h3>
                  </div>
                  <p className="mt-5 pl-6 text-sm leading-relaxed text-white/50 sm:text-base">
                    {a.description}
                  </p>
                  <div className="mt-6 pl-6">
                    <Link
                      href={a.ctaHref ?? "/gallery"}
                      className="inline-flex items-center gap-2 border border-[#F5C400]/30 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400]/8 hover:border-[#F5C400]"
                    >
                      Lihat Gallery
                    </Link>
                  </div>
                </div>

                {/* Right: image */}
                <div className="overflow-hidden border border-white/5 group-hover:border-[#F5C400]/15 transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.imageUrl}
                    alt={a.title}
                    loading="lazy"
                    className="h-56 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-64 lg:h-56"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
