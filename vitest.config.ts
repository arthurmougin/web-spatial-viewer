import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "server/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/utils/**", "src/store/**", "src/classes/**", "server/**"],
      exclude: [
        "src/components/**",
        "src/lib/**",
        "src/**/*.d.ts",
        "server/**/*.d.ts",
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
