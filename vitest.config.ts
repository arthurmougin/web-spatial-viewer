import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use happy-dom — lighter than jsdom, covers URL / fetch / window APIs.
    // Note: WebGL / R3F / uikit components are NOT testable here (no GPU).
    // Those require a real browser or playwright.
    environment: "happy-dom",

    // Make describe / it / expect available globally (no explicit imports needed)
    globals: true,

    // Global setup: jest-dom matchers
    setupFiles: ["./src/test/setup.ts"],

    // Only collect coverage for pure-logic modules, not 3D/R3F components
    coverage: {
      provider: "v8",
      include: ["src/utils/**", "src/store/**", "src/classes/**"],
      exclude: [
        "src/components/**",
        "src/lib/**", // bridge script has no DOM-testable logic
        "src/**/*.d.ts",
      ],
      reporter: ["text", "lcov", "html"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@types": resolve(__dirname, "types"),
    },
  },
});
