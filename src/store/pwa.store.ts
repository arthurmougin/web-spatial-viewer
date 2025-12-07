import { create } from "zustand";
import type { WebSpatialSDKSignature } from "../../types/bridge";
import { defaultWebManifest, type WebManifest } from "../../types/pwa";
import { FetchManifest } from "../utils/pwa.utils";

interface PWAState {
  manifest: WebManifest | null;
  webSpatialSDKSignature: WebSpatialSDKSignature | null;
  loadManifest: (url: string) => Promise<void>;
  setSpatialSDKSignature: (signature: WebSpatialSDKSignature | null) => void;
}

export const usePWAStore = create<PWAState>((set) => ({
  manifest: null,
  webSpatialSDKSignature: null,
  loadManifest: async (url: string) => {
    const manifest = await FetchManifest(url);
    if (manifest) {
      if (!manifest.theme_color) {
        manifest.theme_color = defaultWebManifest.theme_color as string;
      }
      if (!manifest.background_color) {
        manifest.background_color =
          defaultWebManifest.background_color as string;
      }
      if (!manifest.display) {
        manifest.display = defaultWebManifest.display;
      }
      if (!manifest.name) {
        manifest.name = defaultWebManifest.name as string;
      }

      document.documentElement.style.setProperty(
        "--pwa-background-color",
        manifest.background_color
      );
      document.documentElement.style.setProperty(
        "--pwa-theme-color",
        manifest.theme_color
      );
    }

    set({ manifest });
  },
  setSpatialSDKSignature: (signature: WebSpatialSDKSignature | null) => {
    set({ webSpatialSDKSignature: signature });
  },
}));
