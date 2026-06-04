import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getStrategyNote } from "@/features/strategy/queries";
import { StrategyNoteEditForm } from "@/features/strategy/components/StrategyNoteEditForm";

export const dynamic = "force-dynamic";

interface EditStrategyNotePageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function EditStrategyNotePage({
  params,
}: EditStrategyNotePageProps) {
  const { "team-slug": slug, id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/${slug}/strategy/${id}/edit`);

  const note = await getStrategyNote(id);
  if (!note) notFound();

  const { data: membership } = await supabase
    .from("team_members")
    .select("role, user_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  const canEdit =
    membership?.role === "captain" ||
    membership?.role === "coach" ||
    membership?.role === "manager" ||
    membership?.role === "owner" ||
    user.email === process.env.OWNER_EMAIL;

  if (!canEdit) redirect(`/${slug}/strategy/${id}`);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8 w-full">
      <div className="flex justify-start">
        <Link
          href={`/${slug}/strategy/${id}`}
          className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/40 px-3.5 py-1.5 text-xs font-semibold text-white/60 transition-all duration-300 hover:bg-zinc-800/60 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke catatan
        </Link>
      </div>

      <div className="mx-auto max-w-2xl w-full space-y-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl tracking-tight text-left">
          Edit Catatan Strategi
        </h1>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6 w-full shadow-xl shadow-black/20">
          <StrategyNoteEditForm
            orgSlug={slug}
            noteId={id}
            initialValues={{
              title: note.title,
              content: note.content,
              tags: note.tags,
              visibility: note.visibility,
            }}
          />
        </div>
      </div>
    </div>
  );
}
