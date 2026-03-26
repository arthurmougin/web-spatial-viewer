import { resolve } from "path";
import { defineConfig } from "vite";

// Bridge-only watch build.
// Outputs dist/lib/spatial-viewer-bridge.js — same filename expected by server.ts.
// Usage: npm run lib:watch
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        "spatial-viewer-bridge": resolve(
          __dirname,
          "src/lib/spatial-viewer-bridge.ts",
        ),
      },
      output: {
        entryFileNames: "lib/[name].js",
        format: "es",
      },
    },
    outDir: "dist",
    emptyOutDir: false,
    minify: false,
  },
});
