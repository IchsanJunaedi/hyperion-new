"use client";

import { ExternalLink, File, Loader2, Paperclip, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { recordFileUploadAction } from "../actions";
import type { FileRow } from "../queries";

interface ContextFilesProps {
  orgId: string;
  orgSlug: string;
  refType: "scrim" | "strategy" | "announcement";
  refId: string;
  canUpload: boolean;
  initialFiles?: FileRow[];
}

const MAX_SIZE = 50 * 1024 * 1024;

function stripTimestampPrefix(name: string): string {
  return name.replace(/^\d{10,}-/, "");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ContextFiles = ({
  orgId,
  orgSlug,
  refType,
  refId,
  canUpload,
  initialFiles = [],
}: ContextFilesProps) => {
  const [files, setFiles] = useState<FileRow[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setError(`File terlalu besar (maks 50MB)`);
      return;
    }
    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const timestamp = Date.now();
      const folder = refType === "scrim" ? "scrims" : refType === "strategy" ? "strategy" : "announcements";
      const filePath = `${orgId}/${folder}/${timestamp}-${file.name}`;

      const { error: storageErr } = await supabase.storage
        .from("org-private")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (storageErr) {
        setError(storageErr.message);
        return;
      }

      const result = await recordFileUploadAction(orgSlug, orgId, {
        storage_path: filePath,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        ref_type: refType,
        ref_id: refId,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      // Optimistically add the new file to local state
      setFiles((prev) => [
        {
          id: result.id,
          organization_id: orgId,
          division_id: null,
          uploaded_by: "",
          bucket_name: "org-private",
          storage_path: filePath,
          file_name: file.name,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          ref_type: refType,
          ref_id: refId,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleOpen(file: FileRow) {
    setOpeningId(file.id);
    const supabase = createClient();
    const { data, error: urlErr } = await supabase.storage
      .from("org-private")
      .createSignedUrl(file.storage_path, 300);

    setOpeningId(null);
    if (urlErr || !data?.signedUrl) {
      setError("Gagal membuka file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  if (files.length === 0 && !canUpload) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ui-text-2 uppercase tracking-wide">
          <Paperclip className="h-3.5 w-3.5" />
          File Terlampir
        </span>
        {canUpload && (
          <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-ui-border px-2.5 text-xs text-ui-text-2 transition hover:bg-ui-elevated hover:text-ui-text">
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {uploading ? "Mengupload..." : "Upload"}
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-400">{error}</p>
      )}

      {files.length === 0 ? (
        <p className="text-xs text-ui-text-muted">Belum ada file terlampir.</p>
      ) : (
        <div className="divide-y divide-ui-border rounded-lg border border-ui-border">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2.5 px-3 py-2 transition hover:bg-white/[0.02]"
            >
              <File className="h-3.5 w-3.5 shrink-0 text-ui-text-muted" />
              <button
                type="button"
                disabled={openingId === f.id}
                onClick={() => handleOpen(f)}
                className="min-w-0 flex-1 cursor-pointer truncate text-left text-xs text-ui-text hover:text-ui-text hover:underline underline-offset-2 disabled:opacity-50"
              >
                {stripTimestampPrefix(f.file_name)}
              </button>
              {openingId === f.id ? (
                <Loader2 className="h-3 w-3 animate-spin text-ui-text-muted shrink-0" />
              ) : (
                <ExternalLink className="h-3 w-3 text-ui-text-muted shrink-0" />
              )}
              <span className="shrink-0 text-[10px] text-ui-text-muted">
                {formatSize(f.file_size)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export { ContextFiles };
