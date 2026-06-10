import { Handshake } from "lucide-react";
import { notFound } from "next/navigation";

import { getWorkspaceSponsors } from "@/features/sponsors/queries";
import { getOrgBySlug } from "@/features/teams/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface SponsorsPageProps {
  params: Promise<{ "team-slug": string }>;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  negotiation: "Negosiasi",
  completed: "Selesai",
  cancelled: "Batal",
};

const SponsorsPage = async ({ params }: SponsorsPageProps) => {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const sponsors = await getWorkspaceSponsors(organization.id);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Handshake className="h-5 w-5 text-[#9B9A97]" />
        <h1 className="text-lg font-semibold text-[#E5E2E1]">Sponsor</h1>
      </div>

      {sponsors.length === 0 ? (
        <p className="text-sm text-[#6B6A68]">Belum ada sponsor aktif.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="rounded-lg border border-[#2D2D2D] bg-[#202020] p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                {sponsor.logo_url ? (
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    className="h-10 w-10 rounded object-contain bg-[#2D2D2D] p-1 shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-[#2D2D2D] flex items-center justify-center shrink-0">
                    <Handshake className="h-5 w-5 text-[#6B6A68]" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-[#E5E2E1] truncate">{sponsor.name}</p>
                  <span className="inline-block text-xs text-emerald-400 bg-emerald-400/10 rounded px-1.5 py-0.5 mt-0.5">
                    {STATUS_LABEL[sponsor.status] ?? sponsor.status}
                  </span>
                </div>
              </div>
              {sponsor.notes && (
                <p className="text-sm text-[#9B9A97] leading-relaxed line-clamp-3">
                  {sponsor.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { SponsorsPage as default };
