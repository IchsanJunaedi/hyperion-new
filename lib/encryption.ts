import "server-only";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Get the encryption key from environment variable.
 * Must be a 64-character hex string (32 bytes for AES-256).
 */
function getKey(): Buffer {
  const keyHex = String(process.env.ENCRYPTION_KEY ?? "");
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "Missing or invalid ENCRYPTION_KEY. Generate one with: openssl rand -hex 32",
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a plaintext value using AES-256-GCM.
 * Returns a hex string in the format: iv:tag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

/**
 * Decrypt a value encrypted with `encrypt()`.
 * Expects format: iv:tag:ciphertext
 */
export function decrypt(encoded: string): string {
  const key = getKey();
  const parts = encoded.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format");
  }

  const ivHex = String(parts[0] ?? "");
  const tagHex = String(parts[1] ?? "");
  const encrypted = String(parts[2] ?? "");

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Create a deterministic SHA-256 hash of a phone number for lookups.
 * Normalizes the phone to 62XXXXXXXXX format before hashing.
 */
export function hashPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("62")
    ? digits
    : digits.startsWith("0")
      ? "62" + digits.slice(1)
      : "62" + digits;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
