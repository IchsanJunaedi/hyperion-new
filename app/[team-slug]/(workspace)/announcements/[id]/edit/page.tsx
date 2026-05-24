import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAnnouncement } from "@/features/announcements/queries";
import { AnnouncementEditForm } from "@/features/announcements/components/AnnouncementEditForm";

export const dynamic = "force-dynamic";

interface EditAnnouncementPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function EditAnnouncementPage({
  params,
}: EditAnnouncementPageProps) {
  const { "team-slug": slug, id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/${slug}/announcements/${id}/edit`);

  const announcement = await getAnnouncement(id);
  if (!announcement) notFound();

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  const canEdit =
    membership?.role === "captain" ||
    membership?.role === "coach" ||
    membership?.role === "manager" ||
    membership?.role === "owner" ||
    user.email === process.env.OWNER_EMAIL;

  if (!canEdit) redirect(`/${slug}/announcements/${id}`);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      <div className="flex justify-start">
        <Link
          href={`/${slug}/announcements/${id}`}
          className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-all duration-300 hover:bg-zinc-800/60 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke pengumuman
        </Link>
      </div>

      <div className="mx-auto max-w-2xl w-full space-y-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl tracking-tight text-left">
          Edit Pengumuman
        </h1>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6 w-full shadow-xl shadow-black/20">
          <AnnouncementEditForm
            orgSlug={slug}
            announcementId={id}
            initialValues={{
              title: announcement.title,
              body: announcement.body,
              is_pinned: announcement.is_pinned,
            }}
          />
        </div>
      </div>
    </div>
  );
}
