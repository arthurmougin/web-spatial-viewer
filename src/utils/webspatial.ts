import type { WebManifestIcon } from "../types/spatial";

// Récupère la meilleure icône disponible
export function getLoadingIcon(icons: WebManifestIcon[]) {
  const maskableIcon = icons.find(
    (icon) =>
      icon.purpose === "maskable" && parseInt(icon.sizes.split("x")[0]) >= 512
  );
  if (maskableIcon) return maskableIcon.src;

  const sortedIcons = [...icons].sort((a, b) => {
    const sizeA = parseInt(a.sizes.split("x")[0]);
    const sizeB = parseInt(b.sizes.split("x")[0]);
    return sizeB - sizeA;
  });

  return sortedIcons[0]?.src || null;
}

// Vérifie si une URL est dans le scope
export function isUrlInScope(url: string, scopePath: string, baseUrl: string) {
  try {
    const urlObj = new URL(url);
    const scopeUrl = new URL(scopePath, baseUrl);
    return urlObj.pathname.startsWith(scopeUrl.pathname);
  } catch {
    return false;
  }
}

// Vérifie et charge le manifest
export async function checkWebManifest(proxyUrl: string) {
  try {
    // Récupère le chemin de base de l'URL actuelle
    const { pathname } = new URL(proxyUrl);
    const basePath = pathname.substring(0, pathname.lastIndexOf("/") + 1);
    const manifestUrl = new URL(
      `${basePath}manifest.webmanifest`,
      proxyUrl
    ).toString();
    const response = await fetch(manifestUrl);

    if (response.ok) {
      const manifest = await response.json();

      // Convertir les chemins relatifs des icônes en absolus
      manifest.icons = manifest.icons.map((icon: WebManifestIcon) => ({
        ...icon,
        src: new URL(icon.src, proxyUrl).toString(),
      }));

      // Vérifier les icônes requises
      const hasRequiredIcons =
        manifest.icons.some(
          (icon: WebManifestIcon) => icon.purpose === "any"
        ) &&
        manifest.icons.some(
          (icon: WebManifestIcon) =>
            icon.purpose === "maskable" &&
            parseInt(icon.sizes.split("x")[0]) >= 1024
        );

      if (!hasRequiredIcons) {
        console.warn(
          "Attention : Il manque des icônes requises (any et/ou maskable 1024x1024)"
        );
      }

      // Définir le scope par défaut
      if (!manifest.scope && manifest.start_url) {
        const startUrl = new URL(manifest.start_url, proxyUrl);
        manifest.scope = startUrl.pathname.substring(
          0,
          startUrl.pathname.lastIndexOf("/") + 1
        );
      }

      return manifest;
    }
  } catch (err) {
    console.log("Pas de manifest.webmanifest trouvé:", err);
  }
  return null;
}
