export async function findAndLoadManifest(): Promise<Record<
  string,
  unknown
> | null> {
  // Cherche d'abord dans le HTML
  const manifestLink = document.querySelector('link[rel="manifest"]');
  const manifestUrl = manifestLink?.getAttribute("href");

  if (!manifestUrl) {
    console.log("Pas de manifest déclaré dans le HTML");
    return null;
  }

  try {
    // Convertit l'URL relative en absolue
    const absoluteManifestUrl = new URL(
      manifestUrl,
      window.location.href
    ).toString();
    const response = await fetch(absoluteManifestUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const manifest = await response.json();
    console.log("Manifest trouvé dans le HTML:", manifest);
    return manifest;
  } catch (error) {
    console.error("Erreur lors du chargement du manifest:", error);
    return null;
  }
}
