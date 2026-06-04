export const CREDENTIALS = {
  owner:   { email: process.env.E2E_OWNER_EMAIL ?? "",   password: process.env.E2E_OWNER_PASSWORD ?? "" },
  manager: { email: process.env.E2E_MANAGER_EMAIL ?? "", password: process.env.E2E_MANAGER_PASSWORD ?? "" },
  coach:   { email: process.env.E2E_COACH_EMAIL ?? "",   password: process.env.E2E_COACH_PASSWORD ?? "" },
  captain: { email: process.env.E2E_CAPTAIN_EMAIL ?? "", password: process.env.E2E_CAPTAIN_PASSWORD ?? "" },
  member:  { email: process.env.E2E_MEMBER_EMAIL ?? "",  password: process.env.E2E_MEMBER_PASSWORD ?? "" },
} as const;

export type Role = keyof typeof CREDENTIALS;

export const TEST_TEAM_SLUG = process.env.E2E_TEST_TEAM_SLUG ?? "e2e-test";

export function allCredsConfigured(): boolean {
  return Object.values(CREDENTIALS).every((c) => c.email && c.password);
}
