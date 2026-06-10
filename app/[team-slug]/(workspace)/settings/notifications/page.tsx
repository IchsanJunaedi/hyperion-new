import { notFound, redirect } from "next/navigation";

import { getOrgBySlug } from "@/features/teams/queries";
import { WaDeliveryTable } from "@/features/notifications/components/WaDeliveryTable";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NotificationsSettingsPage({
  params,
}: {
  params: Promise<{ "team-slug": string }>;
}) {
  const { "team-slug": slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/${slug}/settings/notifications`);

  // Captain+ gate
  const { data: isCaptain } = await supabase.rpc("is_captain_or_above", {
    org_id: org.id,
  });
  if (!isCaptain) redirect(`/${slug}`);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-xl font-semibold text-ui-text">
        Status Pengiriman WhatsApp
      </h1>
      <p className="mt-1 text-sm text-ui-text-2">
        Pantau status pengiriman notifikasi WhatsApp ke anggota tim.
      </p>
      <div className="mt-6">
        <WaDeliveryTable orgId={org.id} orgSlug={slug} />
      </div>
    </div>
  );
}
