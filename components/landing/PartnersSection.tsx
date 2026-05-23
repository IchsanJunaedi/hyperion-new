const PARTNERS = [
  { name: "Partner 1", imageUrl: "https://hyperionteam.id/storage/partners/01JZPD66GVYZ3V64K59DENV86X.png" },
  { name: "Partner 2", imageUrl: "https://hyperionteam.id/storage/partners/01JZPD6FE6CJ4STMBZ92BG6905.png" },
  { name: "Partner 3", imageUrl: "https://hyperionteam.id/storage/partners/01JZPD6QMPNEBTFH83S9DR2WRP.png" },
  { name: "Partner 4", imageUrl: "https://hyperionteam.id/storage/partners/01JZPD9BMKXCYRFWJMS4JSSC4S.png" },
  { name: "Partner 5", imageUrl: "https://hyperionteam.id/storage/partners/01JZPD7F8KJ673VNKC4Y1TMJRY.png" },
  { name: "Partner 6", imageUrl: "https://hyperionteam.id/storage/partners/01JZPD7TAM6H93H9XG56ST7H9Q.png" },
  { name: "Partner 7", imageUrl: "https://hyperionteam.id/storage/partners/01JZPD89RJXEARGPW11RNCHTDV.png" },
  { name: "Partner 8", imageUrl: "https://hyperionteam.id/storage/partners/01JZPD8PBS7TAJ9AWVKCHQKT75.png" },
];

// Duplicate for seamless infinite loop
const MARQUEE_ITEMS = [...PARTNERS, ...PARTNERS];

export function PartnersSection() {
  return (
    <section className="bg-[#080808] py-20">
      {/* Section header */}
      <div className="mb-10 px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-[#F5C400]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
              Partners &amp; Sponsors
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
        </div>
      </div>

      {/* Marquee track */}
      <div className="relative overflow-hidden border-y border-white/5 py-6">
        {/* Left fade */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#080808] to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#080808] to-transparent" />

        <div className="flex animate-marquee items-center gap-0">
          {MARQUEE_ITEMS.map((p, i) => (
            <div
              key={`${p.imageUrl}-${i}`}
              className="flex shrink-0 items-center justify-center px-10"
              style={{ minWidth: "160px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.name}
                loading="lazy"
                className="max-h-12 w-auto object-contain opacity-50 grayscale transition hover:opacity-90 hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
