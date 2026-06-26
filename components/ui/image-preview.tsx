"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ImagePreviewProps {
  src?: string | null;
  storagePath?: string | null;
  bucket?: string;
  alt: string;
  className?: string;
}

const ImagePreview = ({ src, storagePath, bucket = "org-private", alt, className }: ImagePreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (src) {
      setResolvedUrl(src);
      return;
    }

    let active = true;
    async function load() {
      const path = storagePath;
      if (!path) {
        setResolvedUrl(null);
        return;
      }
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 3600);
        if (active) {
          if (error) {
            console.error("[ImagePreview] error getting signed URL:", error);
            setResolvedUrl(null);
          } else {
            setResolvedUrl(data?.signedUrl ?? null);
          }
        }
      } catch (err) {
        console.error("[ImagePreview] error:", err);
        if (active) setResolvedUrl(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [src, storagePath, bucket]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-black/10 text-ui-text-muted`}>
        <Loader2 className="h-4 w-4 animate-spin text-ui-text-muted" />
      </div>
    );
  }

  if (!resolvedUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-black/10 text-ui-text-muted text-xs`}>
        Tidak ada preview
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedUrl}
        alt={alt}
        className={`${className} cursor-pointer hover:opacity-85 transition-opacity`}
        onClick={() => setIsOpen(true)}
      />

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="max-w-[90vw] max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedUrl}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};

export { ImagePreview };

