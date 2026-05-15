interface Partner {
  name: string;
  imageUrl: string;
}

// Partner logos pulled directly from the live Laravel storage to keep the
// section visually identical. Will be moved into Supabase Storage later.
const PARTNERS: Partner[] = [
  {
    name: "Partner 1",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD66GVYZ3V64K59DENV86X.png",
  },
  {
    name: "Partner 2",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD6FE6CJ4STMBZ92BG6905.png",
  },
  {
    name: "Partner 3",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD6QMPNEBTFH83S9DR2WRP.png",
  },
  {
    name: "Partner 4",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD9BMKXCYRFWJMS4JSSC4S.png",
  },
  {
    name: "Partner 5",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD7F8KJ673VNKC4Y1TMJRY.png",
  },
  {
    name: "Partner 6",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD7TAM6H93H9XG56ST7H9Q.png",
  },
  {
    name: "Partner 7",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD89RJXEARGPW11RNCHTDV.png",
  },
  {
    name: "Partner 8",
    imageUrl:
      "https://hyperionteam.id/storage/partners/01JZPD8PBS7TAJ9AWVKCHQKT75.png",
  },
];

export function PartnersSection() {
  return (
    <section className="px-6 py-24 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold text-white sm:text-4xl">
          Our Partners
        </h2>
        <div className="mt-14 grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {PARTNERS.map((p) => (
            <div
              key={p.imageUrl}
              className="flex h-24 items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.name}
                loading="lazy"
                className="max-h-20 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
