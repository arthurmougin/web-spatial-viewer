import { create } from "zustand";
import type { Manifest } from "../types/manifest";
import { logger } from "../utils/logger";

interface WebSpatialState {
  manifest: Manifest | null;
  currentUrl: string | null;
  isLoading: boolean;
  error: string | null;
  fetchManifest: (url: string) => Promise<void>;
}

export const useStore = create<WebSpatialState>()((set, get) => ({
  manifest: null,
  currentUrl: null,
  isLoading: false,
  error: null,

  fetchManifest: async (url: string) => {
    // Éviter les appels en double
    if (get().isLoading || url === get().currentUrl) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const manifestUrl = new URL("/manifest.webmanifest", url).toString();

      logger.debug(
        "Tentative de récupération du manifest depuis:",
        manifestUrl
      );

      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error(
          `Impossible de récupérer le manifest: ${response.statusText}`
        );
      }

      const manifest = await response.json();
      logger.info("Manifest reçu:", manifest);

      // Vérifier que l'URL n'a pas changé pendant le chargement
      if (url === get().currentUrl) {
        set({
          manifest,
          currentUrl: url,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      logger.error("Erreur lors de la récupération du manifest:", error);
      set({
        error:
          error instanceof Error ? error.message : "Une erreur est survenue",
        isLoading: false,
      });
    }
  },
}));
