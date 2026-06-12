import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectMimeType, getExtensionFromMime } from "@/lib/utils/file";

const UPLOAD_RATE_LIMIT = 10;
const UPLOAD_WINDOW_MS = 60 * 1000;

async function checkUploadRateLimit(ip: string): Promise<boolean> {
  const identifier = `trial-upload:${ip}`;
  const admin = createAdminClient();
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("login_rate_limits")
    .select("attempts, updated_at")
    .eq("identifier", identifier)
    .maybeSingle();
  const lastUpdate = data?.updated_at ? new Date(data.updated_at) : null;
  const isExpired = !lastUpdate || now.getTime() - lastUpdate.getTime() > UPLOAD_WINDOW_MS;
  const attempts = isExpired ? 1 : (data?.attempts ?? 0) + 1;
  if (attempts > UPLOAD_RATE_LIMIT) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("login_rate_limits").upsert({
    identifier,
    attempts,
    updated_at: isExpired ? now.toISOString() : data.updated_at,
    locked_until: isExpired ? null : data?.locked_until ?? null,
  });
  return true;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const allowed = await checkUploadRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const trialId = form.get("trialId") as string | null;

    if (!file || !trialId) {
      return NextResponse.json({ error: "File dan trialId wajib ada" }, { status: 400 });
    }

    // 1. UUID validation
    if (!UUID_REGEX.test(trialId)) {
      return NextResponse.json({ error: "trialId tidak valid" }, { status: 400 });
    }

    // 2. Validate file size
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 5 MB" }, { status: 400 });
    }

    // 3. Verify trial in database is active
    const admin = createAdminClient();
    const { data: trial, error: trialError } = await admin
      .from("open_trials")
      .select("id, status")
      .eq("id", trialId)
      .maybeSingle();

    if (trialError || !trial) {
      return NextResponse.json({ error: "Trial tidak ditemukan" }, { status: 400 });
    }
    if (trial.status !== "active") {
      return NextResponse.json({ error: "Pendaftaran trial ini sudah ditutup" }, { status: 400 });
    }

    // 4. Read file content to verify magic bytes
    const buffer = await file.arrayBuffer();
    const mime = detectMimeType(buffer);

    if (!mime || !ALLOWED_TYPES.includes(mime)) {
      return NextResponse.json({ error: "Hanya PNG, JPG, atau WebP yang diizinkan" }, { status: 400 });
    }

    // 5. Safe file extension
    const ext = getExtensionFromMime(mime) ?? "jpg";
    const path = `${trialId}/${Date.now()}.${ext}`;

    const blob = new Blob([buffer], { type: mime });

    const { error: uploadError } = await admin.storage
      .from("trial-screenshots")
      .upload(path, blob, { contentType: mime, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: signData, error: signError } = await admin.storage
      .from("trial-screenshots")
      .createSignedUrl(path, 3600); // 1 hour for preview

    if (signError || !signData) {
      return NextResponse.json({ error: "Gagal membuat link preview" }, { status: 500 });
    }

    return NextResponse.json({ url: signData.signedUrl });
  } catch (err) {
    console.error("Screenshot upload error:", err);
    return NextResponse.json({ error: "Upload gagal" }, { status: 500 });
  }
}

