"use client";

import { createClient } from "@/lib/supabase/client";
import { ExternalLink, File, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateTournamentBracketAction } from "../actions";

interface TournamentBracketCardProps {
  orgSlug: string;
  orgId: string;
  tournamentId: string;
  initialBracketLink: string | null;
  initialBracketFilePath: string | null;
  canManage: boolean;
}

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

function stripTimestampPrefix(name: string): string {
  return name.replace(/^\d{10,}-/, "");
}

function getFileName(path: string | null): string {
  if (!path) return "";
  const parts = path.split("/");
  return stripTimestampPrefix(parts[parts.length - 1] || "");
}

const TournamentBracketCard = ({
  orgSlug,
  orgId,
  tournamentId,
  initialBracketLink,
  initialBracketFilePath,
  canManage,
}: TournamentBracketCardProps) => {
  const [editing, setEditing] = useState(false);
  const [bracketLink, setBracketLink] = useState(initialBracketLink ?? "");
  const [filePath, setFilePath] = useState(initialBracketFilePath ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [pending, startTransition] = useTransition();
  const [opening, setOpening] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleOpen() {
    if (!filePath) return;
    setOpening(true);
    try {
      const supabase = createClient();
      const { data, error: urlErr } = await supabase.storage
        .from("org-private")
        .createSignedUrl(filePath, 300);

      if (urlErr || !data?.signedUrl) {
        toast.error("Gagal membuka file bracket");
        return;
      }
      window.open(data.signedUrl, "_blank");
    } catch (e) {
      toast.error("Gagal membuka file bracket");
    } finally {
      setOpening(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      toast.error("File terlalu besar (maks 50MB)");
      return;
    }
    setSelectedFile(file);
  }

  async function handleSave() {
    startTransition(async () => {
      let finalFilePath = filePath;

      if (selectedFile) {
        setUploading(true);
        try {
          const supabase = createClient();
          const timestamp = Date.now();
          const uploadedPath = `${orgId}/tournaments/${timestamp}-${selectedFile.name}`;

          const { error: storageErr } = await supabase.storage
            .from("org-private")
            .upload(uploadedPath, selectedFile, { cacheControl: "3600", upsert: false });

          if (storageErr) {
            toast.error(`Gagal upload file: ${storageErr.message}`);
            setUploading(false);
            return;
          }
          finalFilePath = uploadedPath;
        } catch (err: any) {
          toast.error(`Gagal upload file: ${err.message}`);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      const res = await updateTournamentBracketAction(
        orgSlug,
        tournamentId,
        bracketLink.trim() || null,
        finalFilePath || null
      );

      if (res.ok) {
        toast.success("Bracket turnamen berhasil disimpan!");
        setFilePath(finalFilePath);
        setSelectedFile(null);
        setEditing(false);
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleCancel() {
    setBracketLink(initialBracketLink ?? "");
    setFilePath(initialBracketFilePath ?? "");
    setSelectedFile(null);
    setEditing(false);
  }

  function handleRemoveFile() {
    setFilePath("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const hasBracket = !!initialBracketLink || !!filePath;

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Bracket Turnamen</h2>
        {canManage && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs text-[#9B9A97] hover:text-[#E5E2E1] cursor-pointer transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Atur Bracket
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-[#6B6A68] font-medium">Link Bracket (Opsional)</label>
            <input
              type="url"
              placeholder="https://challonge.com/..."
              value={bracketLink}
              onChange={(e) => setBracketLink(e.target.value)}
              className="h-8 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-xs text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#6B6A68] font-medium">File Bracket (Opsional)</label>
            {filePath || selectedFile ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-[#191919] px-3 py-2">
                <File className="h-4 w-4 shrink-0 text-white/35" />
                <span className="min-w-0 flex-1 truncate text-xs text-white/75">
                  {selectedFile ? selectedFile.name : getFileName(filePath)}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex h-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/10 hover:bg-white/[0.02] transition">
                <div className="flex flex-col items-center justify-center py-2 text-center">
                  <Upload className="h-4 w-4 text-white/35 mb-1" />
                  <p className="text-[10px] text-white/35 font-medium">
                    Pilih file (.pdf, .png, .jpg, .xlsx, dll)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={pending || uploading}
              onClick={handleSave}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-yellow-400 px-3.5 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
            >
              {(pending || uploading) && <Loader2 className="h-3 w-3 animate-spin" />}
              Simpan
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="h-8 rounded-md border border-[#2D2D2D] px-3.5 text-xs text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {initialBracketLink && (
            <a
              href={initialBracketLink.startsWith("http") ? initialBracketLink : `https://${initialBracketLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-white/70 hover:bg-white/[0.05] hover:text-white transition"
            >
              <ExternalLink className="h-4 w-4 text-yellow-400 shrink-0" />
              <span className="flex-1 truncate font-medium">Buka Link Bracket</span>
              <span className="text-[10px] text-white/30 shrink-0">External Link</span>
            </a>
          )}

          {filePath && (
            <button
              type="button"
              disabled={opening}
              onClick={handleOpen}
              className="w-full flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-white/70 hover:bg-white/[0.05] hover:text-white transition cursor-pointer text-left"
            >
              {opening ? (
                <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
              ) : (
                <File className="h-4 w-4 text-blue-400 shrink-0" />
              )}
              <span className="flex-1 truncate font-medium">{getFileName(filePath)}</span>
              <span className="text-[10px] text-white/30 shrink-0">Download File</span>
            </button>
          )}

          {!hasBracket && (
            <p className="text-xs text-white/35 italic">Belum ada link atau file bracket yang dilampirkan.</p>
          )}
        </div>
      )}
    </article>
  );
};
export { TournamentBracketCard };
