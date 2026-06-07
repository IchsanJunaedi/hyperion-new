import Link from "next/link";

export async function DivisionsSection() {
  const items = [
    {
      id: "mlbb",
      name: "Mobile Legends",
      slug: "mobile-legends",
      game: "MLBB",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop",
      logo: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      )
    },
    {
      id: "pubg",
      name: "PUBG Mobile",
      slug: "pubg-mobile",
      game: "PUBGM",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop",
      logo: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20" />
        </svg>
      )
    },
    {
      id: "valorant",
      name: "Valorant",
      slug: "valorant",
      game: "VALORANT",
      image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=600&auto=format&fit=crop",
      logo: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h4l6-16 6 16h4z" />
        </svg>
      )
    },
    {
      id: "freefire",
      name: "Free Fire",
      slug: "free-fire",
      game: "FREE FIRE",
      image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop",
      logo: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    }
  ];

  return (
    <section className="bg-[#000000] px-5 py-24 sm:px-8 lg:px-10 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        
        {/* Header - Two Columns */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="md:max-w-md">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-4 w-0.5 bg-[#D4FF00]" />
              <p className="font-orbitron text-[9px] font-bold uppercase tracking-[0.3em] text-[#D4FF00]">
                Our Divisions
              </p>
            </div>
            <h2 className="font-bebas text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[0.9] tracking-wide text-white">
              RISE AND RULE
            </h2>
          </div>
          <div className="md:max-w-md flex flex-col items-start md:items-end">
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed md:text-right mb-3">
              Hyperion Team bersaing di berbagai turnamen regional utama, menaungi divisi esports mobile dengan jajaran roster berbakat yang terus mengejar keunggulan.
            </p>
            <Link
              href="/divisions"
              className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-[#D4FF00] hover:text-white transition-colors duration-200"
            >
              All Divisions →
            </Link>
          </div>
        </div>

        {/* Division Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((div) => (
            <Link
              key={div.id}
              href={`/divisions/${div.slug}`}
              className="group relative flex h-40 overflow-hidden border border-white/5 bg-white/[0.01] hover:border-[#D4FF00]/40 transition-all duration-500 clip-cyber-btn"
            >
              {/* Left Side: Photo (hidden by default, opens up on hover) */}
              <div className="relative h-full w-0 group-hover:w-[68%] transition-all duration-500 ease-out overflow-hidden z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={div.image}
                  alt={div.name}
                  className="h-full w-full object-cover min-w-[200px]"
                />
                {/* Gradient blend */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#070707]/95 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Right Side: Logo & Info */}
              <div className="flex-1 h-full flex flex-col items-center justify-center p-4 group-hover:bg-[#D4FF00] group-hover:text-black transition-all duration-500 z-10">
                <span className="text-white group-hover:text-black transition-colors duration-500">
                  {div.logo}
                </span>
                <span className="mt-3 font-bebas text-lg font-bold uppercase tracking-wider text-white group-hover:text-black transition-colors duration-500">
                  {div.name}
                </span>
                <span className="font-orbitron text-[9px] font-bold uppercase tracking-widest text-white/40 group-hover:text-black/60 transition-colors duration-500">
                  {div.game}
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
