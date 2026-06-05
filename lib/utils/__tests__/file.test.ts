import { describe, it, expect } from "vitest";
import {
  detectMimeType,
  getExtensionFromMime,
  getStoragePathFromUrl,
} from "@/lib/utils/file";

const buf = (...bytes: number[]): ArrayBuffer => new Uint8Array(bytes).buffer;

describe("detectMimeType", () => {
  it("returns null for buffers shorter than 4 bytes", () => {
    expect(detectMimeType(buf(0x89, 0x50))).toBeNull();
    expect(detectMimeType(buf())).toBeNull();
  });

  it("detects PNG", () => {
    expect(detectMimeType(buf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a))).toBe("image/png");
  });

  it("detects JPEG", () => {
    expect(detectMimeType(buf(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
  });

  it("detects PDF", () => {
    expect(detectMimeType(buf(0x25, 0x50, 0x44, 0x46, 0x2d))).toBe("application/pdf");
  });

  it("detects WebP (RIFF....WEBP)", () => {
    expect(
      detectMimeType(buf(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50)),
    ).toBe("image/webp");
  });

  it("returns null for RIFF whose WEBP marker is missing", () => {
    expect(
      detectMimeType(buf(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0, 0, 0, 0)),
    ).toBeNull();
  });

  it("returns null for a RIFF header too short to be WebP", () => {
    expect(detectMimeType(buf(0x52, 0x49, 0x46, 0x46))).toBeNull();
  });

  it("detects DOCX / Office Open XML (PK..)", () => {
    expect(detectMimeType(buf(0x50, 0x4b, 0x03, 0x04))).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("detects legacy DOC (CFB compound file)", () => {
    expect(
      detectMimeType(buf(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)),
    ).toBe("application/msword");
  });

  it("returns null for a CFB header too short / mismatched tail", () => {
    expect(detectMimeType(buf(0xd0, 0xcf, 0x11, 0xe0))).toBeNull();
    expect(
      detectMimeType(buf(0xd0, 0xcf, 0x11, 0xe0, 0x00, 0x00, 0x00, 0x00)),
    ).toBeNull();
  });

  it("returns null for unknown signatures", () => {
    expect(detectMimeType(buf(0x00, 0x01, 0x02, 0x03))).toBeNull();
  });
});

describe("getExtensionFromMime", () => {
  it.each([
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["image/webp", "webp"],
    ["application/pdf", "pdf"],
    [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "docx",
    ],
    ["application/msword", "doc"],
  ])("maps %s to %s", (mime, ext) => {
    expect(getExtensionFromMime(mime)).toBe(ext);
  });

  it("returns null for an unknown mime type", () => {
    expect(getExtensionFromMime("application/zip")).toBeNull();
  });
});

describe("getStoragePathFromUrl", () => {
  it("returns null for null or undefined", () => {
    expect(getStoragePathFromUrl(null)).toBeNull();
    expect(getStoragePathFromUrl(undefined)).toBeNull();
  });

  it("returns the value unchanged when it is already a path (not http)", () => {
    expect(getStoragePathFromUrl("folder/file.png")).toBe("folder/file.png");
  });

  it("extracts the storage path after the trial-screenshots marker", () => {
    expect(
      getStoragePathFromUrl(
        "https://x.supabase.co/storage/v1/object/public/trial-screenshots/abc/def.png",
      ),
    ).toBe("abc/def.png");
  });

  it("strips the query string from the extracted path", () => {
    expect(
      getStoragePathFromUrl("https://x/trial-screenshots/abc/def.png?token=123"),
    ).toBe("abc/def.png");
  });

  it("returns the url unchanged when the marker is absent", () => {
    expect(getStoragePathFromUrl("https://x/other/path.png")).toBe(
      "https://x/other/path.png",
    );
  });
});
