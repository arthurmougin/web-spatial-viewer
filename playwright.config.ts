import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
});
