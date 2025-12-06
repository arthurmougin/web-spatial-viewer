
//suppose the manifest.webmanifest is located at the root of the PWA
export async function FetchManifest(manifestUrl: string): Promise<Partial<WebManifest>|null> {
  const response = await fetch(manifestUrl);
  if(response.ok) {
    const manifest: WebManifest = await response.json();
    console.log("Manifest fetched successfully:", manifest);
    return manifest;
  }
  console.warn("No manifest found at:", manifestUrl);
  return null;
}
export const checkWebManifest = async (proxyUrl: string) => {
  try {
    const manifestUrl = new URL("/manifest.webmanifest", proxyUrl).toString();
    const response = await fetch(manifestUrl);
    if (response.ok) {
      const manifest: WebManifest = await response.json();
     // console.log("Web Manifest trouvé:", manifest);

      // Convertir les chemins relatifs des icônes en absolus
      manifest.icons = manifest.icons.map((icon) => ({
        ...icon,
        src: new URL(icon.src, proxyUrl).toString(),
      }));

      // Vérifier que les icônes requises sont présentes
      const hasRequiredIcons =
        manifest.icons.some((icon) => icon.purpose === "any") &&
        manifest.icons.some(
          (icon) =>
            icon.purpose === "maskable" &&
            parseInt(icon.sizes.split("x")[0]) >= 1024
        );

      if (!hasRequiredIcons) {
        console.warn(
          "Attention : Il manque des icônes requises (any et/ou maskable 1024x1024)"
        );
      }

      // Si le scope n'est pas défini, utiliser le chemin du start_url
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
    console.error("Pas de manifest.webmanifest trouvé:", err);
  }
  return null;
};


export const isUrlInScope = (url: string, scopePath: string, baseUrl: string) => {
  try {
    const urlObj = new URL(url);
    const scopeUrl = new URL(scopePath, baseUrl);
    return urlObj.pathname.startsWith(scopeUrl.pathname);
  } catch {
    return false;
  }
};

export const getLoadingIcon = (icons: WebManifestIcon[]) => {
  // Préfère une icône maskable de grande taille, sinon prend la plus grande disponible
  const maskableIcon = icons.find(
    (icon) =>
      icon.purpose === "maskable" && parseInt(icon.sizes.split("x")[0]) >= 512
  );
  if (maskableIcon) return maskableIcon.src;

  // Trie les icônes par taille et prend la plus grande
  const sortedIcons = [...icons].sort((a, b) => {
    const sizeA = parseInt(a.sizes.split("x")[0]);
    const sizeB = parseInt(b.sizes.split("x")[0]);
    return sizeB - sizeA;
  });

  return sortedIcons[0]?.src || null;
};


export function proxyFyUrl(url: string): URL {
  const { hostname, pathname, search } = new URL(url);
  // Séparer le nom de domaine principal des sous-domaines
  const parts = hostname.split(".");
  const mainDomain = parts.slice(-2).join("-"); // ex: vercel-app
  const subParts = parts.slice(0, -2); // ex: ['lofi', 'jingle', 'avp']

  // Construire le sous-domaine pour le proxy
  const proxyHostname =
    subParts.length > 0
      ? `${subParts.join("-")}--${mainDomain}`
      : mainDomain;

  const proxyPort = 3000;
  const isSSL = location.protocol === "https:";
  const proxyProtocol = isSSL ? "https:" : "http:";
  const baseProxyUrl = `${proxyProtocol}//${proxyHostname}.localhost:${proxyPort}`;
  const proxyUrl = `${baseProxyUrl}${pathname}${search}`;
  return new URL(proxyUrl);
}

export function UnProxyFyUrl(proxyUrl: URL): URL {
  const { hostname, pathname, search } = proxyUrl;
  // Ex: lofi-jingle-avp--vercel-app.localhost:3000
  const match = hostname.match(/^([^.]+)\.localhost(?::\d+)?$/);
  if (!match) return proxyUrl;

  // Sépare le nom du site du domaine principal
  const parts = match[1].split("--");
  if (parts.length === 1) {
    // Cas simple : pas de séparation de domaine
    return new URL(`https://${parts[0].replace(/-/g, ".")}${pathname}${search}`);
  }
  
  // Cas avec séparation de domaine (ex: lofi-jingle-avp--vercel-app)
  const siteName = parts[0]; // garde les tirets pour les sous-parties du nom
  const domain = parts[1].replace(/-/g, ".");
  return new URL(`https://${siteName}.${domain}${pathname}${search}`);
}
/*
export const handleSubmit = async (url: string) => {
  if (url) {
    try {
      const { hostname, pathname, search } = new URL(url);
      // Séparer le nom de domaine principal des sous-domaines
      const parts = hostname.split(".");
      const mainDomain = parts.slice(-2).join("-"); // ex: vercel-app
      const subParts = parts.slice(0, -2); // ex: ['lofi', 'jingle', 'avp']

      // Construire le sous-domaine pour le proxy
      const proxyHostname =
        subParts.length > 0
          ? `${subParts.join("-")}--${mainDomain}`
          : mainDomain;

      const proxyPort = 3000;
      const newBaseProxyUrl = `https://${proxyHostname}.localhost:${proxyPort}`;
      const proxyUrl = `${newBaseProxyUrl}${pathname}${search}`;
     // console.log("Proxy URL:", proxyUrl);

      // Vérifier l'existence du manifest
      const manifestData = await checkWebManifest(proxyUrl);

      if (manifestData) {
        setManifest(manifestData);
        setBaseProxyUrl(newBaseProxyUrl);

        // Sélectionner une icône de chargement
        const iconSrc = getLoadingIcon(manifestData.icons);
        if (iconSrc) {
          setLoadingIcon(iconSrc);
        }

        // Vérifier si une start_url différente est spécifiée
        if (manifestData.start_url && manifestData.start_url !== "/") {
          let startUrl = manifestData.start_url;
          // Si start_url est une URL complète, vérifier si elle est dans le même domaine
          try {
            const startUrlObj = new URL(startUrl);
            if (startUrlObj.hostname === hostname) {
              // Convertir en URL proxy si même domaine
              startUrl = `${newBaseProxyUrl}${startUrlObj.pathname}${startUrlObj.search}`;
            } else {
              // URL externe : charger telle quelle si dans le scope
              if (
                !manifestData.scope ||
                isUrlInScope(startUrl, manifestData.scope, newBaseProxyUrl)
              ) {
                setIframeSrc(startUrl);
              } else {
                setIframeSrc(proxyUrl);
              }
              setShowSearch(false);
              return;
            }
          } catch {
            // URL relative
            startUrl = new URL(startUrl, newBaseProxyUrl).toString();
          }
          setIframeSrc(startUrl);
        } else {
          setIframeSrc(proxyUrl);
        }
      } else {
        setIframeSrc(proxyUrl);
        setBaseProxyUrl(newBaseProxyUrl);
      }

      setShowSearch(false);
    } catch (error) {
      console.error("URL invalide:", error);
    }
  }
};
*/