export function detectMimeType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4) return null;

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return "image/jpeg";
  }

  // PDF: 25 50 44 46 (%PDF)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }

  // WebP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  // ZIP/Office Open XML (DOCX, XLSX, etc.): 50 4B 03 04 (PK..)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  // Legacy DOC (CFB - Compound File Binary Format): D0 CF 11 E0 A1 B1 1A E1
  if (
    bytes[0] === 0xD0 &&
    bytes[1] === 0xCF &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xE0 &&
    bytes.length >= 8 &&
    bytes[4] === 0xA1 &&
    bytes[5] === 0xB1 &&
    bytes[6] === 0x1A &&
    bytes[7] === 0xE1
  ) {
    return "application/msword";
  }

  return null;
}

export function getExtensionFromMime(mime: string): string | null {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
  };
  return map[mime] ?? null;
}

export function getStoragePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith("http")) return url;

  const marker = "/trial-screenshots/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  
  const path = url.substring(index + marker.length);
  const qIndex = path.indexOf("?");
  if (qIndex !== -1) {
    return path.substring(0, qIndex);
  }
  return path;
}
