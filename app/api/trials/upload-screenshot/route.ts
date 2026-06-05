import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectMimeType, getExtensionFromMime } from "@/lib/utils/file";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
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

