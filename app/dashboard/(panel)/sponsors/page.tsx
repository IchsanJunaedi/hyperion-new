import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsors } from "@/features/sponsors/queries";
import { SponsorListClient } from "@/features/sponsors/components/SponsorListClient";

export const dynamic = "force-dynamic";

export default async function DashboardSponsorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();
  const { data: orgs } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);

  const orgId = orgs?.[0]?.id;
  if (!orgId) redirect("/dashboard");

  const sponsors = await getSponsors([orgId]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="flex items-center gap-2 text-sm text-[#9B9A97]">
          <Link href="/dashboard" className="hover:text-[#D4D4D4]">Home</Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">Sponsor</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-8 py-10">
        <SponsorListClient
          sponsors={sponsors}
          orgId={orgId}
          detailBasePath="/dashboard/sponsors"
        />
      </main>
    </>
  );
}
