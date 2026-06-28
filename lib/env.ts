/**
 * Environment variable validation.
 *
 * Import this module at the start of the root layout (app/layout.tsx) to
 * fail fast at build / startup time if a required env var is missing,
 * rather than failing silently later with a cryptic error.
 *
 * Never import this in client components.
 */

const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const SERVER_REQUIRED_VARS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "FONNTE_API_TOKEN",
] as const;

function checkEnv(): void {
  const missing: string[] = [];

  for (const name of REQUIRED_VARS) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }

  // Server-only vars checked only when running on server (not client-side).
  // Skip entirely if SKIP_ENV_CHECK=1 (useful in CI / preview builds).
  if (
    process.env.SKIP_ENV_CHECK !== "1" &&
    (typeof window === "undefined" || process.env.NODE_ENV === "test")
  ) {
    for (const name of SERVER_REQUIRED_VARS) {
      if (!process.env[name]) {
        missing.push(name);
      }
    }
  }

  if (missing.length === 0) return;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `[env] Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
        "Set SKIP_ENV_CHECK=1 to bypass during build (not recommended for production).",
    );
  }

  console.warn(
    `[env] Some environment variables are missing:\n  ${missing.join("\n  ")}\n\n` +
      "Set SKIP_ENV_CHECK=1 to silence this warning. " +
      "Some features may not work until these are configured.",
  );
}

checkEnv();

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  mainDomain: process.env.NEXT_PUBLIC_MAIN_DOMAIN ?? "hyperionteam.id",
  fonnteApiToken: process.env.FONNTE_API_TOKEN ?? "",
  fonnteWebhookSecret: process.env.FONNTE_WEBHOOK_SECRET ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  mlbbVisionUrl: process.env.MLBB_VISION_URL ?? "http://127.0.0.1:8000",
} as const;

export type Env = typeof env;
