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
      include: [
        "lib/utils/**/*.{ts,tsx}",
        "lib/validations/**/*.{ts,tsx}",
        "lib/permissions/**/*.{ts,tsx}",
        "features/finances/**/*.{ts,tsx}",
        "features/scrim/**/*.{ts,tsx}",
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
