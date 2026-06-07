import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

function getGameLogo(game: string | null, logoUrl: string | null, name: string) {
  const key = (game ?? "").toLowerCase();
  
  if (key === "mlbb" || key === "mobile legends" || key === "mobile_legends") {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 6l1.5 3.5 3.5.5-2.5 2.5.5 3.5-3-2-3 2 .5-3.5-2.5-2.5 3.5-.5Z" fill="currentColor" />
      </svg>
    );
  }
  if (key === "pubgm" || key === "pubg" || key === "pubg mobile") {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a9 9 0 0 0-9 9c0 2.5 1 4.8 2.8 6.4L5 21h14l-.8-3.6c1.8-1.6 2.8-3.9 2.8-6.4a9 9 0 0 0-9-9z" />
        <path d="M7 10h10v2.5H7V10z" fill="currentColor" />
        <path d="M9 15h6v1.5H9V15z" />
      </svg>
    );
  }
  if (key === "valorant") {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 19h4.5L12 8.5 17.5 19H22L12 2z" fill="currentColor" />
      </svg>
    );
  }
  if (key === "free fire" || key === "freefire" || key === "ff") {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c0 0-4 4.5-4 7.5s3 5.5 4 5.5 4-2.5 4-5.5S12 2 12 2z" fill="currentColor" />
        <path d="M6 19c0-3 3-5 6-5s6 2 6 5v2H6v-2z" />
      </svg>
    );
  }

  // Fallback to custom logo_url from admin panel if uploaded
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className="h-8 w-8 object-contain" />
    );
  }
  
  // Generic controller icon fallback
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M12 12h.01M15 10h.01M17 12h.01M7 12h4M9 10v4" />
    </svg>
  );
}

function getGameBackground(_game: string | null) {
  return "/brand/logo.jpg";
}

export async function DivisionsSection() {
  const admin = createAdminClient();

  const { data: divisions, error } = await admin
    .from("divisions")
    .select("id, name, slug, game, description, logo_url")
    .eq("is_public", true)
    .eq("is_active", true)
    .order("name")
    .limit(20);

  if (error) console.error("DivisionsSection dynamic fetch:", error);

  const items = divisions ?? [];
  if (items.length === 0) return null;

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
          {items.map((div) => {
            const logo = getGameLogo(div.game, div.logo_url, div.name);
            const image = getGameBackground(div.game);

            return (
              <Link
                key={div.id}
                href={`/divisions/${div.slug}`}
                className="group relative flex h-44 overflow-hidden border border-white/5 bg-[#030c1b] hover:border-[#D4FF00]/40 transition-all duration-500 clip-cyber-btn"
              >
                {/* Left Side: Photo (slides open on hover) */}
                <div className="absolute inset-y-0 left-0 w-0 group-hover:w-[76%] transition-all duration-500 ease-out overflow-hidden z-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={div.name}
                    className="h-full w-full object-cover min-w-[350px]"
                  />
                  {/* Dark overlay with gradient blend */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/50 to-[#030c1b] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Text details overlay showing on hover */}
                  <div className="absolute bottom-4 left-5 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 translate-y-3 group-hover:translate-y-0">
                    <span className="font-orbitron text-[8px] font-bold uppercase tracking-[0.2em] text-[#D4FF00]">
                      Division
                    </span>
                    <h3 className="font-bebas text-2xl font-black uppercase tracking-wide text-white leading-none mt-1">
                      {div.name}
                    </h3>
                  </div>
                </div>

                {/* Right Side: Logo vertical stripe (covers full card initially, shrinks to stripe on hover) */}
                <div className="absolute inset-y-0 right-0 w-full group-hover:w-[24%] transition-all duration-500 ease-out flex flex-col items-center justify-center bg-[#071428] group-hover:bg-[#0b1b33] border-l border-transparent group-hover:border-white/10 z-10">
                  <span className="text-white/80 group-hover:text-[#D4FF00] transition-colors duration-500 scale-100 group-hover:scale-90">
                    {logo}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
