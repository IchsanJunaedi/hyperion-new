import { Eye, Lock, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getStrategyNote, listStrategyComments } from "@/features/strategy/queries";
import { StrategyNoteActions } from "@/features/strategy/components/StrategyNoteActions";
import { StrategyComments } from "@/features/strategy/components/StrategyComments";
import { ContextFiles } from "@/features/files/components/ContextFiles";
import { getLinkedFiles } from "@/features/files/queries";
import { getCurrentUserRole } from "@/features/roster/queries";

export const dynamic = "force-dynamic";

interface StrategyNoteDetailPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

const VISIBILITY_LABELS: Record<string, { label: string; Icon: typeof Eye }> = {
  public: { label: "Semua member", Icon: Eye },
  division: { label: "Divisi saja", Icon: Users },
  private: { label: "Pribadi", Icon: Lock },
};

export default async function StrategyNoteDetailPage({
  params,
}: StrategyNoteDetailPageProps) {
  const { "team-slug": slug, id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [note, comments] = await Promise.all([
    getStrategyNote(id),
    listStrategyComments(id),
  ]);
  if (!note) notFound();

  const [currentUserRole, linkedFiles] = await Promise.all([
    getCurrentUserRole(note.organization_id),
    getLinkedFiles(note.organization_id, "strategy", id),
  ]);
  const canUploadFiles = ["coach", "captain", "manager", "owner"].includes(currentUserRole ?? "");

  const date = new Date(note.updated_at).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  const vis = VISIBILITY_LABELS[note.visibility] ?? VISIBILITY_LABELS["division"] ?? { label: "Divisi saja", Icon: Users };
  const VisIcon = vis.Icon;

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-2">
        <Link
          href={`/${slug}/strategy`}
          className="text-xs text-ui-text-2 hover:text-ui-text"
        >
          ← Bank Strategi
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-ui-text-2">
            <VisIcon className="h-3 w-3" />
            {vis.label}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-ui-text">{note.title}</h1>
        <p className="text-xs text-ui-text-2">Diperbarui {date}</p>
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-ui-text-2"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <article className="max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <div className="whitespace-pre-line font-mono text-sm leading-relaxed text-ui-text">
          {note.content}
        </div>
      </article>

      <StrategyNoteActions orgSlug={slug} noteId={note.id} />

      {(linkedFiles.length > 0 || canUploadFiles) && (
        <article className="max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
          <ContextFiles
            orgId={note.organization_id}
            orgSlug={slug}
            refType="strategy"
            refId={id}
            canUpload={canUploadFiles}
            initialFiles={linkedFiles}
          />
        </article>
      )}

      <div className="max-w-3xl">
        <StrategyComments
          orgSlug={slug}
          noteId={note.id}
          currentUserId={user?.id ?? ""}
          currentUserDisplayName={(user?.user_metadata?.["display_name"] as string | undefined) ?? user?.email ?? "Member"}
          comments={comments}
        />
      </div>
    </div>
  );
}
