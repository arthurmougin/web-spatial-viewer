import { useState, useEffect } from "react";
import { Scene3D } from "./components/Scene3D";
import { SearchBar } from "./components/SearchBar";

interface WebManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

interface WebManifest {
  name: string;
  display: "minimal-ui" | "standalone" | "fullscreen" | "tabbed" | "browser";
  start_url: string;
  scope?: string;
  xr_main_scene?: {
    default_size?: {
      width: number;
      height: number;
    };
  };
  icons: WebManifestIcon[];
}

function App() {
  const [iframeSrc, setIframeSrc] = useState<string | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(true);
  const [manifest, setManifest] = useState<WebManifest | null>(null);
  const [loadingIcon, setLoadingIcon] = useState<string | null>(null);
  const [baseProxyUrl, setBaseProxyUrl] = useState<string | null>(null);

  useEffect(() => {
    // Gestion de la navigation de l'iframe
    const handleMessage = (event: MessageEvent) => {
      if (!manifest || !baseProxyUrl || event.data.type !== "NAVIGATION")
        return;

      const newUrl = event.data.url;
      if (isUrlInScope(newUrl, manifest.scope || "/", baseProxyUrl)) {
        // Si l'URL est dans le scope, on la charge dans l'iframe
        setIframeSrc(newUrl);
      } else {
        // Sinon, on ouvre dans le navigateur
        window.open(newUrl, "_blank");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [manifest, baseProxyUrl]);

  const getLoadingIcon = (icons: WebManifestIcon[]) => {
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

  const isUrlInScope = (url: string, scopePath: string, baseUrl: string) => {
    try {
      const urlObj = new URL(url);
      const scopeUrl = new URL(scopePath, baseUrl);
      return urlObj.pathname.startsWith(scopeUrl.pathname);
    } catch {
      return false;
    }
  };

  const checkWebManifest = async (proxyUrl: string) => {
    try {
      const manifestUrl = new URL("/manifest.webmanifest", proxyUrl).toString();
      const response = await fetch(manifestUrl);
      if (response.ok) {
        const manifest: WebManifest = await response.json();
        console.log("Web Manifest trouvé:", manifest);

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
      console.log("Pas de manifest.webmanifest trouvé:", err);
    }
    return null;
  };

  const handleSubmit = async (url: string) => {
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
        const newBaseProxyUrl = `http://${proxyHostname}.localhost:${proxyPort}`;
        const proxyUrl = `${newBaseProxyUrl}${pathname}${search}`;
        console.log("Proxy URL:", proxyUrl);

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

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {showSearch && <SearchBar onSubmit={handleSubmit} />}
      {loadingIcon && !iframeSrc && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 0 20px rgba(0,0,0,0.3)",
            textAlign: "center",
          }}
        >
          <img
            src={loadingIcon}
            alt={manifest?.name || "Loading"}
            style={{
              maxWidth: "128px",
              maxHeight: "128px",
              display: "block",
              margin: "0 auto",
            }}
          />
          {manifest?.name && (
            <div style={{ marginTop: "10px", fontWeight: "bold" }}>
              {manifest.name}
            </div>
          )}
        </div>
      )}
      <Scene3D
        iframeSrc={iframeSrc}
        defaultSize={manifest?.xr_main_scene?.default_size}
      />
    </div>
  );
}

export default App;
