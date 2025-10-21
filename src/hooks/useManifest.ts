import { useState, useCallback } from "react";
import type { WebManifest } from "../types/spatial";

export function useManifest() {
  const [manifest, setManifest] = useState<WebManifest | null>(null);
  const [loadingIcon, setLoadingIcon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleWebManifest = useCallback((manifestData: WebManifest) => {
    setManifest(manifestData);

    // Si le manifest a des icônes, sélectionner l'icône de chargement
    if (manifestData.icons?.length > 0) {
      const maskableIcon = manifestData.icons.find(
        (icon) =>
          icon.purpose === "maskable" &&
          parseInt(icon.sizes.split("x")[0]) >= 512
      );

      if (maskableIcon) {
        setLoadingIcon(maskableIcon.src);
      } else {
        // Trie les icônes par taille et prend la plus grande
        const sortedIcons = [...manifestData.icons].sort((a, b) => {
          const sizeA = parseInt(a.sizes.split("x")[0]);
          const sizeB = parseInt(b.sizes.split("x")[0]);
          return sizeB - sizeA;
        });
        setLoadingIcon(sortedIcons[0]?.src || null);
      }
    }
  }, []);

  return {
    manifest,
    loadingIcon,
    isLoading,
    handleWebManifest,
  };
}
