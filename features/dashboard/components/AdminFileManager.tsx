"use client";

import { File, Loader2, Search, Trash2, Download, Building2 } from "lucide-react";
import { useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { createClient } from "@/lib/supabase/client";

interface StorageFileRecord {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  organization_id: string;
  orgName: string;
  uploadedByName: string;
}

interface AdminFileManagerProps {
  initialFiles: StorageFileRecord[];
  organizations: Array<{ id: string; name: string }>;
}

const AdminFileManager = ({
  initialFiles,
  organizations,
}: AdminFileManagerProps) => {
  const [files, setFiles] = useState<StorageFileRecord[]>(initialFiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<{ id: string; storagePath: string } | null>(null);

  // Filter files
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.file_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesOrg = selectedOrgId === "" || file.organization_id === selectedOrgId;
    return matchesSearch && matchesOrg;
  });

  async function handleDelete(id: string, storagePath: string) {
    setDeletingId(id);
    setPendingDeleteFile(null);
    const supabase = createClient();

    try {
      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from("org-private")
        .remove([storagePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // 2. Delete from DB (cascade if fkey or manual)
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", id);

      if (dbError) {
        notify.error(`Gagal menghapus dari database: ${dbError.message}`);
      } else {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        notify.success("File berhasil dihapus secara permanen");
      }
    } catch (err: unknown) {
      notify.error("Terjadi kesalahan saat menghapus file");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(id: string, storagePath: string, fileName: string) {
    setDownloadingId(id);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.storage
        .from("org-private")
        .createSignedUrl(storagePath, 60);

      if (error || !data?.signedUrl) {
        notify.error("Gagal membuat link unduhan");
        return;
      }
      
      // Open in new tab
      window.open(data.signedUrl, "_blank");
    } catch (err) {
      notify.error("Gagal mengunduh file");
    } finally {
      setDownloadingId(null);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-ui-surface/40 border border-ui-border rounded-2xl p-5">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-ui-text tracking-tight">Total File Platform</h2>
          <p className="text-xs text-ui-text-2">Kelola semua file yang diupload oleh tim esports di Hyperion.</p>
        </div>
        <div className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-ui-border bg-ui-surface/60 text-yellow-400">
          {files.length} File Terdaftar
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ui-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama file..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-ui-border bg-ui-surface/40 text-sm text-ui-text placeholder:text-ui-text-muted focus:border-yellow-400 focus:outline-none transition-all duration-300"
          />
        </div>

        {/* Filter Org */}
        <div className="w-full sm:w-[240px]">
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-ui-border bg-ui-surface/40 text-sm text-ui-text focus:border-yellow-400 focus:outline-none cursor-pointer transition-all duration-300"
          >
            <option value="" className="bg-ui-surface">Semua Tim</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id} className="bg-ui-surface">
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Files List Table/Card */}
      {filteredFiles.length === 0 ? (
        <div className="rounded-2xl border border-ui-border bg-ui-surface/20 p-12 text-center">
          <File className="h-10 w-10 text-ui-text-muted mx-auto mb-3" />
          <p className="text-sm text-ui-text-muted">Tidak ada file yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ui-border bg-ui-surface/40 shadow-xl shadow-black/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ui-border text-[11px] font-bold uppercase tracking-wider text-ui-text-muted bg-ui-surface/20">
                <th className="px-5 py-4">Nama File</th>
                <th className="px-5 py-4">Tim / Organisasi</th>
                <th className="px-5 py-4">Ukuran</th>
                <th className="px-5 py-4">Diunggah Oleh</th>
                <th className="px-5 py-4">Tanggal Unggah</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border">
              {filteredFiles.map((file) => {
                const date = new Date(file.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr
                    key={file.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    {/* File Name with Clickable Download */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <File className="h-4 w-4 shrink-0 text-ui-text-muted group-hover:text-yellow-400/80 transition-colors" />
                        <button
                          type="button"
                          onClick={() => handleDownload(file.id, file.storage_path, file.file_name)}
                          disabled={downloadingId === file.id}
                          className="min-w-0 font-medium text-sm text-ui-text hover:text-yellow-400 hover:underline text-left truncate transition-colors disabled:opacity-50"
                        >
                          {file.file_name}
                        </button>
                      </div>
                    </td>

                    {/* Org Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 text-xs text-ui-text">
                        <Building2 className="h-3.5 w-3.5 text-ui-text-muted shrink-0" />
                        <span>{file.orgName}</span>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="px-5 py-3.5 text-xs text-ui-text-2 font-mono">
                      {formatFileSize(file.file_size)}
                    </td>

                    {/* Uploaded By */}
                    <td className="px-5 py-3.5 text-xs text-ui-text-2">
                      {file.uploadedByName}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-ui-text-muted">
                      {date}
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Download */}
                        <button
                          type="button"
                          onClick={() => handleDownload(file.id, file.storage_path, file.file_name)}
                          disabled={downloadingId === file.id}
                          className="rounded-lg p-1.5 text-ui-text-muted hover:bg-ui-elevated hover:text-ui-text transition disabled:opacity-40"
                          title="Unduh file"
                        >
                          {downloadingId === file.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          disabled={deletingId === file.id}
                          onClick={() => setPendingDeleteFile({ id: file.id, storagePath: file.storage_path })}
                          className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-40"
                          title="Hapus permanen"
                        >
                          {deletingId === file.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!pendingDeleteFile}
        title="Hapus File Permanen"
        message="File akan dihapus dari storage dan database secara permanen. Tindakan ini tidak bisa dibatalkan."
        confirmText="Hapus Permanen"
        pending={!!deletingId}
        onConfirm={() => pendingDeleteFile && handleDelete(pendingDeleteFile.id, pendingDeleteFile.storagePath)}
        onCancel={() => setPendingDeleteFile(null)}
      />
    </div>
  );
};
export { AdminFileManager };
