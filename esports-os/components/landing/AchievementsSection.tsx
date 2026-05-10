import Link from "next/link";

interface Achievement {
  title: string;
  description: string;
  imageUrl: string;
  ctaHref?: string;
}

// Mirrors the live hyperionteam.id achievement timeline. These will be moved
// into Supabase content tables in a later step; for now we hardcode them so
// the visual matches 1:1.
const ACHIEVEMENTS: Achievement[] = [
  {
    title: "Juara 1 Liga Esport Nasional Pelajar 2024",
    description:
      "Ini dia SANG JUARA LIGA ESPORTS NASIONAL PELAJAR 2024 - MOBILE LEGENDS🔥🔥 Perjuangan keras tidak mengkhianati hasil dari kerjasama tim. Tetap semangat dan semoga bisa terus mendapatkan juara✨",
    imageUrl:
      "https://hyperionteam.id/storage/timelines/01JZN7JDHN76Z29F9R2NW4VX8K.jpeg",
  },
  {
    title: "Champion RRQ MABAR Esports Tournament Season 4",
    description:
      "Ribuan pelajar telah bertanding di RRQ MABAR Esports Tournament Season 4 dan inilah juaranya! SMAS Xaverius 1 Palembang berhasil raih back to back champion setelah menang 3-1 di Grand Final RRQ MABAR National Championship melawan SMAK Yos Sudarso Batam.",
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
      className="relative px-6 py-24 sm:px-12 lg:px-20"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">
          Our Achievement
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
          We began our journey in 2020. Here are the awards we have received
          since then
        </p>

        <ol className="relative mt-12 space-y-16 border-l border-yellow-500/30 pl-8">
          {ACHIEVEMENTS.map((a) => (
            <li key={a.title} className="relative">
              <span
                aria-hidden
                className="absolute -left-10 top-2 inline-flex h-3 w-3 rounded-full bg-white ring-4 ring-yellow-500/30"
              />
              <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:gap-12">
                <h3 className="text-3xl font-bold leading-tight text-white/45 sm:text-4xl">
                  {a.title}
                </h3>
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-white/80 sm:text-base">
                    {a.description}
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.imageUrl}
                    alt={a.title}
                    loading="lazy"
                    className="w-full max-w-lg rounded-md"
                  />
                  <div className="pt-2">
                    <Link
                      href={a.ctaHref ?? "/gallery"}
                      className="inline-flex h-9 items-center justify-center rounded-[10px] bg-white px-4 text-xs font-medium text-black transition hover:bg-white/90"
                    >
                      Load More
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
