"use client";

import { File, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { createClient } from "@/lib/supabase/client";
import { FilePreviewModal } from "./FilePreviewModal";

interface FileListProps {
  orgId: string;
  folder?: string;
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string } | null;
}

interface PreviewState {
  file: StorageFile;
  signedUrl: string;
}

export function FileList({ orgId, folder = "files" }: FileListProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFiles() {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("org-private")
        .list(`${orgId}/${folder}`, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (!error && data) {
        setFiles(data as StorageFile[]);
      }
      setLoading(false);
    }
    loadFiles();
  }, [orgId, folder]);

  async function handleDelete(fileName: string, fileId: string) {
    setDeletingId(fileId);
    const supabase = createClient();
    const filePath = `${orgId}/${folder}/${fileName}`;
    
    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage
      .from("org-private")
      .remove([filePath]);

    if (storageError) {
      notify.error("Gagal menghapus file dari storage");
      setDeletingId(null);
      return;
    }

    // 2. Delete from Database
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("storage_path", filePath);

    if (dbError) {
      console.error("Failed to delete database record for file:", dbError);
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    notify.success("File berhasil dihapus");
    setDeletingId(null);
  }

  async function handleOpenPreview(file: StorageFile) {
    setLoadingPreviewId(file.id);
    const supabase = createClient();
    const filePath = `${orgId}/${folder}/${file.name}`;
    const { data, error } = await supabase.storage
      .from("org-private")
      .createSignedUrl(filePath, 300);

    setLoadingPreviewId(null);
    if (error || !data?.signedUrl) {
      notify.error("Gagal membuka file");
      return;
    }
    setPreview({ file, signedUrl: data.signedUrl });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/40">
        Belum ada file yang diupload.
      </p>
    );
  }

  return (
    <>
      {preview && (
        <FilePreviewModal
          fileName={stripTimestampPrefix(preview.file.name)}
          fileSize={
            preview.file.metadata?.size
              ? formatFileSize(preview.file.metadata.size)
              : "—"
          }
          fileDate={new Date(preview.file.created_at).toLocaleDateString(
            "id-ID",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            },
          )}
          signedUrl={preview.signedUrl}
          mimeType={preview.file.metadata?.mimetype ?? undefined}
          onClose={() => setPreview(null)}
        />
      )}
      <div className="divide-y divide-white/5 rounded-lg border border-white/5">
        {files.map((file) => {
          const size = file.metadata?.size
            ? formatFileSize(file.metadata.size)
            : "—";
          const date = new Date(file.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Jakarta",
          });
          const isLoadingThis = loadingPreviewId === file.id;

          return (
            <div
              key={file.id}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.02]"
            >
              {isLoadingThis ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/40" />
              ) : (
                <File className="h-4 w-4 shrink-0 text-white/40" />
              )}
              <button
                type="button"
                disabled={isLoadingThis}
                onClick={() => handleOpenPreview(file)}
                className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm text-white/80 underline-offset-2 transition hover:text-white hover:underline disabled:opacity-60"
              >
                {stripTimestampPrefix(file.name)}
              </button>
              <span className="shrink-0 text-xs text-white/40">{size}</span>
              <span className="shrink-0 text-xs text-white/40">{date}</span>
              <button
                type="button"
                disabled={deletingId === file.id}
                onClick={() => handleDelete(file.name, file.id)}
                className="shrink-0 cursor-pointer rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-red-400 disabled:opacity-40"
                aria-label="Hapus file"
              >
                {deletingId === file.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function stripTimestampPrefix(name: string): string {
  return name.replace(/^\d{10,}-/, "");
}
