import { createClient } from "@/lib/supabase/server";
import { DivisionsGrid } from "./DivisionsGrid";

export async function DivisionsSection() {
  const supabase = await createClient();

  const { data: divisions } = await supabase
    .from("divisions")
    .select("id, name, slug, game, description, logo_url, is_active")
    .is("organization_id", null)
    .eq("is_active", true)
    .order("name")
    .limit(20);

  const items = divisions ?? [];
  if (items.length === 0) return null;

  return (
    <section className="bg-[#060606] px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <DivisionsGrid divisions={items} />
      </div>
    </section>
  );
}
