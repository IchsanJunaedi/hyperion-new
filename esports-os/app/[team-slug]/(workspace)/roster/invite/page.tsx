import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { InviteForm } from "@/features/roster/components/InviteForm";
import { getCurrentMemberRole } from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function InviteMemberPage({ params }: InvitePageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const role = await getCurrentMemberRole(organization.id);
  if (role !== "owner" && role !== "captain") {
    redirect(`/${slug}/roster`);
  }

  const supabase = await createClient();
  const { data: divisions } = await supabase
    .from("divisions")
    .select("id, name")
    .eq("organization_id", organization.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-8">
      <Link
        href={`/${slug}/roster`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke roster
      </Link>
      <header>
        <p className="text-xs uppercase tracking-wide text-white/55">
          Roster · Undang
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          Undang member baru
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Link undangan berlaku 7 hari. Kalau dikirim via WhatsApp, pesan masuk
          antrian dan akan terkirim otomatis oleh Fonnte.
        </p>
      </header>
      <InviteForm orgSlug={slug} divisions={divisions ?? []} />
    </div>
  );
}
