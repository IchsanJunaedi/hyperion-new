"use client";

import { Download, X, File } from "lucide-react";

interface FilePreviewModalProps {
  fileName: string;
  fileSize: string;
  fileDate: string;
  signedUrl: string;
  mimeType?: string;
  onClose: () => void;
}

function getCategory(fileName: string, mimeType?: string): "image" | "pdf" | "other" {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

function triggerDownload(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const FilePreviewModal = ({
  fileName,
  fileSize,
  fileDate,
  signedUrl,
  mimeType,
  onClose,
}: FilePreviewModalProps) => {
  const category = getCategory(fileName, mimeType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 mx-4 w-full max-w-2xl overflow-hidden rounded-xl border border-[#2D2D2D] bg-[#1e1e1e] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D2D2D] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#E5E2E1]">
              {fileName}
            </p>
            <p className="mt-0.5 text-xs text-[#6B6A68]">
              {fileSize} · {fileDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 cursor-pointer rounded-md p-1.5 text-[#6B6A68] transition hover:bg-white/10 hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex min-h-[200px] max-h-[60vh] items-center justify-center overflow-auto bg-[#141414]">
          {category === "image" && (
            <img
              src={signedUrl}
              alt={fileName}
              className="max-h-[60vh] max-w-full object-contain"
            />
          )}
          {category === "pdf" && (
            <iframe
              src={signedUrl}
              className="h-[60vh] w-full"
              title={fileName}
            />
          )}
          {category === "other" && (
            <div className="flex flex-col items-center gap-3 py-12 text-[#6B6A68]">
              <File className="h-12 w-12" />
              <p className="text-sm">Preview tidak tersedia untuk file ini</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#2D2D2D] px-5 py-4">
          <button
            onClick={() => triggerDownload(signedUrl, fileName)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};
export { FilePreviewModal };
