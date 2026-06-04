import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DivisionsSection() {
  const admin = createAdminClient();

  const { data: divisions } = await admin
    .from("divisions")
    .select("id, name, slug, game, description, logo_url")
    .eq("is_public", true)
    .eq("is_active", true)
    .order("name")
    .limit(20);

  const items = divisions ?? [];
  if (items.length === 0) return null;

  return (
    <section className="bg-[#040D1C] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 border-b border-white/12 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
                02 — Our Teams
              </p>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                Divisions
              </h2>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((div) => (
            <Link
              key={div.id}
              href={`/divisions/${div.slug}`}
              className="group flex flex-col gap-3 border border-white/10 bg-[#071428] p-5 transition-all duration-200 hover:border-[#F5C400]/50 hover:bg-[#0C1E3C] sm:p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-white/10 bg-white/5">
                  {div.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={div.logo_url} alt={div.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs font-black uppercase text-white/40">
                      {div.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm text-white/25 transition-colors group-hover:text-[#F5C400]">→</span>
              </div>
              <div>
                <p className="font-black uppercase leading-tight tracking-tight text-white sm:text-sm">
                  {div.name}
                </p>
                {div.game && (
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/45">{div.game}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
