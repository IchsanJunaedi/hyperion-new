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
        // lib/ pure functions, validations, permissions
        "lib/utils/**/*.{ts,tsx}",
        "lib/validations/**/*.{ts,tsx}",
        "lib/permissions/**/*.{ts,tsx}",
        // features — pure logic/query files only (actions excluded below)
        "features/finances/**/*.{ts,tsx}",
        "features/scrim/**/*.{ts,tsx}",
        "features/analytics/**/*.{ts,tsx}",
        "features/roster/logic.ts",
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
        // Server actions — complex auth + DB side-effects, excluded from unit coverage
        "features/**/actions.ts",
        "features/**/actions/**",
        // Static data files
        "features/**/data/**",
      ],
      // ─────────────────────────────────────────────────────────────────────
      // Coverage thresholds — FINAL (Wave E+F complete, targeting 80%)
      // Action files excluded from scope — only pure logic/queries measured.
      // ─────────────────────────────────────────────────────────────────────
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
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
