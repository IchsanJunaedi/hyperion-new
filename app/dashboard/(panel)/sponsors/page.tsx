import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsors } from "@/features/sponsors/queries";
import { SponsorListClient } from "@/features/sponsors/components/SponsorListClient";

export const dynamic = "force-dynamic";

interface DashboardSponsorsPageProps {
  searchParams: Promise<{ org?: string }>;
}

export default async function DashboardSponsorsPage({ searchParams }: DashboardSponsorsPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();
  const { data: allOrgsData } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const allOrgs = allOrgsData ?? [];
  if (allOrgs.length === 0) redirect("/dashboard");

  const sp = await searchParams;
  const isAllOrgs = !sp.org || sp.org === "all";
  const activeOrg = isAllOrgs
    ? null
    : allOrgs.find((o) => o.slug === sp.org) ?? null;

  // Always valid — first org is the default for new sponsor creation
  const defaultOrg = activeOrg ?? allOrgs[0]!;

  // Fetch sponsors: all orgs when Semua Tim, single org otherwise
  const orgIds = isAllOrgs ? allOrgs.map((o) => o.id) : [defaultOrg.id];
  const sponsors = await getSponsors(orgIds);

  const buildTabHref = (orgSlug: string | null) => {
    if (!orgSlug) return "/dashboard/sponsors";
    return `/dashboard/sponsors?org=${orgSlug}`;
  };

  // orgName for Media Kit header
  const mediaKitOrgName = isAllOrgs ? "Semua Tim" : defaultOrg.name;

  return (
    <>
      <main className="mx-auto w-full max-w-5xl flex-1 px-8 py-10 print-main">
        {/* Team tabs — same pattern as /dashboard/calendar */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={buildTabHref(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              isAllOrgs
                ? "bg-yellow-400 text-black"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            Semua Tim
          </Link>
          {allOrgs.map((org) => {
            const isActive = !isAllOrgs && org.id === activeOrg?.id;
            return (
              <Link
                key={org.id}
                href={buildTabHref(org.slug)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? "bg-yellow-400 text-black"
                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                {org.name}
              </Link>
            );
          })}
        </div>

        <SponsorListClient
          sponsors={sponsors}
          orgId={defaultOrg.id}
          orgName={mediaKitOrgName}
          detailBasePath="/dashboard/sponsors"
          isAllOrgs={isAllOrgs}
          organizations={allOrgs.map((o) => ({ id: o.id, name: o.name }))}
        />
      </main>
    </>
  );
}

