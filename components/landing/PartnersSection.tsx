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

const PartnersSection = () => {
  return (
    <section className="bg-[#080808] px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="h-px w-8 bg-[#F5C400]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#F5C400]">
            Partners &amp; Sponsors
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-px border border-white/5 bg-white/5 sm:grid-cols-3 lg:grid-cols-4">
          {PARTNERS.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-center bg-[#080808] p-8 transition hover:bg-[#0D0D0D]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.name}
                loading="lazy"
                className="max-h-10 w-auto object-contain opacity-40 grayscale transition duration-300 hover:opacity-85 hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export { PartnersSection };
