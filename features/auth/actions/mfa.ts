"use server";

import { createClient } from "@/lib/supabase/server";

export interface MfaEnrollResult {
  ok: boolean;
  factorId?: string;
  qrCodeUrl?: string;
  secret?: string;
  message?: string;
}

export interface MfaVerifyResult {
  ok: boolean;
  message?: string;
}

export interface MfaStatusResult {
  ok: boolean;
  isMfaEnabled: boolean;
  factors: Array<{
    id: string;
    friendlyName?: string;
    status: "verified" | "unverified";
  }>;
}

/**
 * Initiates the enrollment of a new TOTP MFA factor.
 */
export async function enrollMfaAction(friendlyName: string = "Hyperion TOTP"): Promise<MfaEnrollResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Anda harus login." };
  }

  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      factorId: data.id,
      qrCodeUrl: data.totp.qr_code,
      secret: data.totp.secret,
    };
  } catch (err) {
    console.error("MFA enroll error:", err);
    return { ok: false, message: "Gagal memulai proses MFA." };
  }
}

/**
 * Verifies a TOTP challenge to complete enrollment or authenticate.
 */
export async function verifyMfaAction(
  factorId: string,
  code: string,
): Promise<MfaVerifyResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Anda harus login." };
  }

  try {
    // Challenge the factor
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError || !challengeData) {
      return { ok: false, message: challengeError?.message ?? "Gagal memicu verifikasi TOTP." };
    }

    // Verify the code against the challenge
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      return { ok: false, message: "Kode OTP tidak valid atau kedaluwarsa." };
    }

    return { ok: true };
  } catch (err) {
    console.error("MFA verify error:", err);
    return { ok: false, message: "Terjadi kesalahan saat memverifikasi kode." };
  }
}

/**
 * Unenrolls/deactivates an existing MFA factor.
 */
export async function unenrollMfaAction(factorId: string): Promise<MfaVerifyResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Anda harus login." };
  }

  try {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true };
  } catch (err) {
    console.error("MFA unenroll error:", err);
    return { ok: false, message: "Gagal menonaktifkan MFA." };
  }
}

/**
 * Checks the MFA status of the currently logged-in user.
 */
export async function getMfaStatusAction(): Promise<MfaStatusResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, isMfaEnabled: false, factors: [] };
  }

  try {
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error || !data) {
      return { ok: false, isMfaEnabled: false, factors: [] };
    }

    const verifiedFactors = data.all.filter((f) => f.status === "verified");

    return {
      ok: true,
      isMfaEnabled: verifiedFactors.length > 0,
      factors: data.all.map((f) => ({
        id: f.id,
        friendlyName: f.friendly_name,
        status: f.status,
      })),
    };
  } catch (err) {
    console.error("MFA status error:", err);
    return { ok: false, isMfaEnabled: false, factors: [] };
  }
}
