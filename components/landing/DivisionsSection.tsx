import { createAdminClient } from "@/lib/supabase/admin";

export async function DivisionsSection() {
  const admin = createAdminClient();

  const { data: divisions } = await admin
    .from("divisions")
    .select("id, name, game, description, logo_url")
    .eq("is_public", true)
    .eq("is_active", true)
    .order("name")
    .limit(20);

  const items = divisions ?? [];
  if (items.length === 0) return null;

  return (
    <section className="bg-black px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-0 border-b border-white/8 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">
                02 — Our Teams
              </p>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                Divisions
              </h2>
            </div>
          </div>
        </div>
        <div>
          {items.map((div) => (
            <div key={div.id} className="border-b border-white/8 py-6">
              <div className="grid grid-cols-[3.5rem_1fr] items-center gap-4 sm:grid-cols-[5rem_1fr] sm:gap-8">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-white/10 bg-white/5">
                  {div.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={div.logo_url} alt={div.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-black uppercase text-white/40">
                      {div.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-black uppercase leading-tight tracking-tight text-white sm:text-lg">
                    {div.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/28 uppercase tracking-wider">{div.game}</p>
                  {div.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-white/32">{div.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
