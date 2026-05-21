import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["__tests__/setup.ts"],
    include: [
      "features/**/__tests__/**/*.test.{ts,tsx}",
      "lib/**/__tests__/**/*.test.{ts,tsx}",
      "__tests__/**/*.test.{ts,tsx}",
    ],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      // ─────────────────────────────────────────────────────────────────────
      // Coverage scope — expanded per wave.
      // See AUTOMATED_TESTING_TRACKER.md for the full roadmap.
      // ─────────────────────────────────────────────────────────────────────
      include: [
        // Wave 0–A: lib/ pure functions & validations
        "lib/utils/**/*.{ts,tsx}",
        "lib/validations/**/*.{ts,tsx}",
        "lib/permissions/**/*.{ts,tsx}",
        // Wave 0–B: features with existing or upcoming tests
        "features/finances/**/*.{ts,tsx}",
        "features/scrim/**/*.{ts,tsx}",
        "features/analytics/**/*.{ts,tsx}",
        // Wave B+: uncomment as tests are added per wave
        // "features/calendar/**/*.{ts,tsx}",
        // "features/tournaments/**/*.{ts,tsx}",
        // "features/announcements/**/*.{ts,tsx}",
        // "features/polls/**/*.{ts,tsx}",
        // "features/strategy/**/*.{ts,tsx}",
        // "features/roster/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
        "**/node_modules/**",
        "**/components/**",
        "**/hooks/**",
        "**/context/**",
        "**/providers/**",
        "lib/supabase/**",
        "lib/actions/**",
        "lib/api/**",
        "**/*.d.ts",
        "**/types/**",
      ],
      // ─────────────────────────────────────────────────────────────────────
      // Coverage thresholds — PHASE 2 (after Wave B = 22.85%)
      // Bumped per wave. See AUTOMATED_TESTING_TRACKER.md § Coverage Threshold Gates
      //
      // To raise thresholds after a wave is done:
      //   Phase 3 (after Wave C): statements: 35, branches: 30, functions: 50, lines: 35
      //   Phase 4 (after Wave D): statements: 45, branches: 40, functions: 62, lines: 45
      //   ...etc. (see tracker for full schedule)
      // ─────────────────────────────────────────────────────────────────────
      thresholds: {
        statements: 22,
        branches: 20,
        functions: 36,
        lines: 22,
      },
      // Human-readable report in CI artifacts + local browser view
      reporter: ["text", "lcov", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Stub Next.js `server-only` guard so Vitest can import server-side modules
      "server-only": path.resolve(__dirname, "__tests__/stubs/server-only.ts"),
    },
  },
});
