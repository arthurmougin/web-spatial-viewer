import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/lib/spatial-viewer-bridge.ts"),
      name: "SpatialViewerBridge",
      fileName: (format) => `spatial-viewer-bridge.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    outDir: "dist/lib",
    // Ne pas vider le dossier dist principal
    emptyOutDir: false,
  },
});
