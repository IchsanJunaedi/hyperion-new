"use client";

import { useState } from "react";
import { Link as LinkIcon, Plus, Video, Youtube, ExternalLink, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { updateScrimVodLinkAction } from "@/features/scrim/actions/vodLinkAction";

interface ScrimVodLinkSectionProps {
  scrimId: string;
  initialLink: string | null;
  canEdit: boolean;
}

function detectPlatform(url: string) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return { name: "YouTube", icon: Youtube, color: "text-red-500", bg: "bg-red-500/10" };
  }
  if (lowerUrl.includes("tiktok.com")) {
    return { name: "TikTok", icon: Video, color: "text-white", bg: "bg-white/10" };
  }
  if (lowerUrl.includes("twitch.tv")) {
    return { name: "Twitch", icon: Video, color: "text-purple-400", bg: "bg-purple-500/10" };
  }
  if (lowerUrl.includes("nimo.tv")) {
    return { name: "Nimo TV", icon: Video, color: "text-green-400", bg: "bg-green-500/10" };
  }
  return { name: "Video", icon: LinkIcon, color: "text-blue-400", bg: "bg-blue-500/10" };
}

const ScrimVodLinkSection = ({ scrimId, initialLink, canEdit }: ScrimVodLinkSectionProps) => {
  const [vodLink, setVodLink] = useState<string | null>(initialLink);
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState(initialLink ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    const finalUrl = inputUrl.trim() ? inputUrl.trim() : null;
    if (finalUrl === vodLink) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    const res = await updateScrimVodLinkAction(scrimId, finalUrl);
    setIsSubmitting(false);

    if (res.ok) {
      setVodLink(finalUrl);
      setIsEditing(false);
      toast.success(finalUrl ? "Link VOD berhasil disimpan" : "Link VOD dihapus");
    } else {
      toast.error(res.message || "Terjadi kesalahan");
    }
  }

  const platform = vodLink ? detectPlatform(vodLink) : null;
  const PlatformIcon = platform?.icon ?? LinkIcon;

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">VOD / Livestream</h2>
        {canEdit && !isEditing && (
          <button
            onClick={() => {
              setInputUrl(vodLink ?? "");
              setIsEditing(true);
            }}
            className="text-xs font-medium text-white/50 hover:text-white transition-colors"
          >
            {vodLink ? "Edit" : "Tambah"}
          </button>
        )}
      </div>

      {!isEditing ? (
        vodLink ? (
          <a
            href={vodLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", platform?.bg)}>
                <PlatformIcon className={cn("h-4 w-4", platform?.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{platform?.name} VOD</p>
                <p className="truncate text-xs text-white/40">{vodLink}</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-white/60 ml-2" />
          </a>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-white/10 py-4">
            <p className="text-xs text-white/40">Belum ada link VOD/Livestream</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              className="rounded-md px-3 py-1.5 text-xs text-white/50 hover:text-white"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
export { ScrimVodLinkSection };
