import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "spatial-viewer-bridge": resolve(
          __dirname,
          "src/lib/spatial-viewer-bridge.ts"
        ),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "spatial-viewer-bridge") {
            return "lib/[name].js";
          }
          return "[name].js";
        },
      },
    },
    outDir: "dist",
    emptyOutDir: false,
    minify: false,
  },
  publicDir: "public",
});
