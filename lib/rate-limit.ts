/**
 * Reusable rate-limiting helpers backed by the `login_rate_limits` table.
 *
 * All operations use the admin client (bypasses RLS) because the table has
 * RLS enabled with no policies — only the service role can read/write it.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type RateLimitRow = Database["public"]["Tables"]["login_rate_limits"]["Row"];

interface RateLimitConfig {
  /** Max attempts within the window. */
  maxAttempts: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Lock duration after max attempts reached (ms). 0 = no lock. */
  lockDurationMs?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 60 * 1000, // 1 minute
  lockDurationMs: 0,
};

/**
 * Check and increment a rate limit counter for the given identifier.
 *
 * Returns `{ allowed, remaining, resetAt }`.
 * - `allowed: true` → request may proceed.
 * - `allowed: false` → rate limit exceeded (HTTP 429).
 */
export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {},
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const { maxAttempts, windowMs, lockDurationMs } = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  const admin = createAdminClient();
  const now = new Date();
  const nowMs = now.getTime();

  const { data } = await admin
    .from("login_rate_limits")
    .select("attempts, locked_until, updated_at")
    .eq("identifier", identifier)
    .maybeSingle();

  const row = data as RateLimitRow | null;

  // If locked and lock hasn't expired, reject immediately
  if (row?.locked_until) {
    const lockUntil = new Date(row.locked_until).getTime();
    if (lockUntil > nowMs) {
      return { allowed: false, remaining: 0, resetAt: lockUntil };
    }
  }

  const lastUpdate = row?.updated_at ? new Date(row.updated_at).getTime() : 0;
  const windowExpired = nowMs - lastUpdate > windowMs;
  const lockExpired = row?.locked_until != null && new Date(row.locked_until) <= now;

  const prevAttempts = windowExpired || lockExpired ? 0 : (row?.attempts ?? 0);
  const newAttempts = prevAttempts + 1;
  const resetAt = windowExpired ? nowMs + windowMs : lastUpdate + windowMs;

  // Determine if locked and compute lock duration
  const shouldLock = lockDurationMs != null && lockDurationMs > 0 && newAttempts >= maxAttempts;
  const lockedUntil = shouldLock
    ? new Date(nowMs + lockDurationMs).toISOString()
    : (lockExpired ? null : row?.locked_until ?? null);

  await admin.from("login_rate_limits").upsert({
    identifier,
    attempts: newAttempts,
    locked_until: lockedUntil,
    updated_at: now.toISOString(),
  });

  if (newAttempts > maxAttempts) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining: maxAttempts - newAttempts, resetAt };
}

/**
 * Convenience: create an IP-based rate limit key.
 */
export function ipKey(ip: string, prefix = "api"): string {
  return `${prefix}:${ip}`;
}

/**
 * Convenience: create an email-based rate limit key.
 */
export function emailKey(email: string, prefix = "action"): string {
  return `${prefix}:${email.toLowerCase()}`;
}

/**
 * Clear a rate limit record (e.g. after successful login).
 */
export async function clearRateLimit(identifier: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("login_rate_limits").delete().eq("identifier", identifier);
}
