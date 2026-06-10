"use client";

import { useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Upload, X } from "lucide-react";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
}

const ImageUpload = ({ value, onChange, folder = "uploads", label = "Gambar" }: Props) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Hanya file gambar yang diperbolehkan");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("public-assets")
        .upload(filename, file, { upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("public-assets")
        .getPublicUrl(filename);
      onChange(urlData.publicUrl);
    } catch (err) {
      alert("Upload gagal: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ui-text-2">{label}</p>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview" className="h-20 w-32 object-cover border border-ui-border" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-32 cursor-pointer flex-col items-center justify-center border border-dashed border-ui-border text-ui-text-muted transition hover:border-[#F5C400]/50 hover:text-[#F5C400] disabled:opacity-50"
        >
          <Upload className="mb-1 h-4 w-4" />
          <span className="text-[10px]">{uploading ? "Uploading..." : "Upload"}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};
export { ImageUpload };
