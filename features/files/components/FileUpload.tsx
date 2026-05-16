"use client";

import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { createClient } from "@/lib/supabase/client";
import { recordFileUploadAction } from "../actions";

interface FileUploadProps {
  orgSlug: string;
  orgId: string;
  /** Subfolder within org-private/{orgId}/ e.g. "strategy", "scrims" */
  folder?: string;
  /** Max file size in bytes. Default 50MB */
  maxSize?: number;
  /** Callback with the uploaded file path */
  onUpload?: (path: string, url: string) => void;
}

export function FileUpload({
  orgSlug,
  orgId,
  folder = "files",
  maxSize = 50 * 1024 * 1024,
  onUpload,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      notify.error(
        `File terlalu besar (maks ${Math.round(maxSize / 1024 / 1024)}MB)`,
      );
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      const supabase = createClient();
      const timestamp = Date.now();
      const filePath = `${orgId}/${folder}/${timestamp}-${file.name}`;

      const { error: storageError } = await supabase.storage
        .from("org-private")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (storageError) {
        notify.error(storageError.message);
        setFileName(null);
        return;
      }

      const { data: signedData } = await supabase.storage
        .from("org-private")
        .createSignedUrl(filePath, 3600);

      const url = signedData?.signedUrl ?? "";

      // Persist metadata to files table for audit trail and member attribution.
      const dbResult = await recordFileUploadAction(orgSlug, orgId, {
        storage_path: filePath,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
      });
      if (!dbResult.ok) {
        // Non-fatal: storage upload succeeded; DB record failed.
        notify.warning(
          `File diupload tapi gagal dicatat ke database: ${dbResult.message}`,
        );
      } else {
        notify.success("File berhasil diupload");
      }

      onUpload?.(filePath, url);
    } catch {
      notify.error("Gagal mengupload file");
      setFileName(null);
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-white/10 px-3 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white">
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Mengupload..." : "Pilih file"}
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        {fileName && !uploading && (
          <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs text-white/60">
            <span className="max-w-[200px] truncate">{fileName}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-white/40 hover:text-white"
              aria-label="Hapus file"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      <p className="text-[10px] text-white/40">
        Maks {Math.round(maxSize / 1024 / 1024)}MB. File disimpan di storage
        tim (hanya member yang bisa akses).
      </p>
    </div>
  );
}
