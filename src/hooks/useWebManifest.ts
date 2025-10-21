import { useState, useEffect, useCallback, useRef } from "react";
import type { WebManifest, WebManifestIcon } from "../types/spatial";
import { logger } from "../utils/logger";
import { validateManifest } from "../utils/manifestValidator";

interface ManifestCache {
  [url: string]: {
    manifest: WebManifest;
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface UseWebManifestReturn {
  iframeSrc: string | undefined;
  showSearch: boolean;
  manifest: WebManifest | null;
  loadingIcon: string | null;
  handleSubmit: (url: string) => Promise<void>;
}

const isUrlInScope = (url: string, scope: string, baseUrl: string): boolean => {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);

    // Si l'URL est dans un domaine différent, vérifier si c'est autorisé par le scope
    if (urlObj.hostname !== baseUrlObj.hostname) {
      return false;
    }

    // Pour les URLs du même domaine, vérifier si le chemin est dans le scope
    const normalizedPath = urlObj.pathname.endsWith("/")
      ? urlObj.pathname
      : `${urlObj.pathname}/`;
    const normalizedScope = scope.endsWith("/") ? scope : `${scope}/`;

    return normalizedPath.startsWith(normalizedScope);
  } catch {
    return false;
  }
};

export function useWebManifest(): UseWebManifestReturn {
  const [iframeSrc, setIframeSrc] = useState<string | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(true);
  const [manifest, setManifest] = useState<WebManifest | null>(null);
  const [loadingIcon, setLoadingIcon] = useState<string | null>(null);
  const [baseProxyUrl, setBaseProxyUrl] = useState<string | null>(null);

  const manifestCache = useRef<ManifestCache>({});
  const urlProcessed = useRef<boolean>(false);

  const getLoadingIcon = useCallback((icons: WebManifestIcon[]) => {
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
  }, []);

  const checkWebManifest = useCallback(async (proxyUrl: string) => {
    try {
      // Vérifier le cache
      const cached = manifestCache.current[proxyUrl];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log("Utilisation du manifest en cache");
        return cached.manifest;
      }

      const { pathname } = new URL(proxyUrl);
      const basePath = pathname.substring(0, pathname.lastIndexOf("/") + 1);
      const manifestUrl = new URL(
        `${basePath}manifest.webmanifest`,
        proxyUrl
      ).toString();

      const response = await fetch(manifestUrl);
      if (response.ok) {
        const manifest: WebManifest = await response.json();

        // Validation du manifest
        const validationErrors = validateManifest(manifest);
        if (validationErrors.length > 0) {
          logger.warn("Le manifest contient des erreurs de validation", {
            errors: validationErrors,
            manifest,
          });
        }

        // Mise en cache du manifest uniquement s'il n'y a pas d'erreurs critiques
        if (
          validationErrors.every(
            (error) =>
              !["name", "start_url", "xr_main_scene"].includes(error.field)
          )
        ) {
          manifestCache.current[proxyUrl] = {
            manifest,
            timestamp: Date.now(),
          };
        } else {
          logger.error(
            "Le manifest contient des erreurs critiques et ne sera pas mis en cache"
          );
          return null;
        }

        manifest.icons = manifest.icons.map((icon) => ({
          ...icon,
          src: new URL(icon.src, proxyUrl).toString(),
        }));

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
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Gestion des logs du bridge
      if (event.data?.type === "BRIDGE_LOG") {
        const { level, message, data } = event.data.data;
        const logLevel = level as keyof typeof logger;
        if (typeof logger[logLevel] === "function") {
          logger[logLevel](message, data);
        }
        return;
      }

      if (event.data?.type === "MANIFEST_READY") {
        logger.info("Manifest reçu:", event.data.manifest);
        if (event.data.manifest) {
          setManifest(event.data.manifest);

          if (event.data.manifest.icons?.length > 0) {
            const iconSrc = getLoadingIcon(event.data.manifest.icons);
            if (iconSrc) setLoadingIcon(iconSrc);
          }
        }
      } else if (event.data?.type === "FRAME_READY") {
        console.log("Frame chargée, finalisation de l'initialisation");

        // Maintenant qu'on sait que la frame est prête, on peut configurer l'URL
        if (manifest?.start_url && manifest.start_url !== "/" && baseProxyUrl) {
          const startUrl = new URL(manifest.start_url, baseProxyUrl).toString();
          setIframeSrc(startUrl);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [baseProxyUrl, getLoadingIcon, manifest]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!manifest || !baseProxyUrl || event.data.type !== "NAVIGATION")
        return;

      const newUrl = event.data.url;
      if (isUrlInScope(newUrl, manifest.scope || "/", baseProxyUrl)) {
        setIframeSrc(newUrl);
      } else {
        window.open(newUrl, "_blank");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [manifest, baseProxyUrl]);

  const handleSubmit = useCallback(
    async (url: string) => {
      if (url) {
        try {
          const { hostname, pathname, search } = new URL(url);
          const parts = hostname.split(".");
          const mainDomain = parts.slice(-2).join("-");
          const subParts = parts.slice(0, -2);

          const proxyHostname =
            subParts.length > 0
              ? `${subParts.join("-")}--${mainDomain}`
              : mainDomain;

          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set("url", encodeURIComponent(url));
          window.history.pushState({}, "", `?${urlParams.toString()}`);

          const proxyPort = 3000;
          const newBaseProxyUrl = `http://${proxyHostname}.localhost:${proxyPort}`;
          const proxyUrl = `${newBaseProxyUrl}${pathname}${search}`;

          if (newBaseProxyUrl !== baseProxyUrl) {
            console.log("Proxy URL:", proxyUrl);
          }

          const manifestData = await checkWebManifest(proxyUrl);

          if (manifestData) {
            setManifest(manifestData);
            setBaseProxyUrl(newBaseProxyUrl);

            const iconSrc = getLoadingIcon(manifestData.icons);
            if (iconSrc) {
              setLoadingIcon(iconSrc);
            }

            if (manifestData.start_url && manifestData.start_url !== "/") {
              let startUrl = manifestData.start_url;
              try {
                const startUrlObj = new URL(startUrl);
                if (startUrlObj.hostname === hostname) {
                  startUrl = `${newBaseProxyUrl}${startUrlObj.pathname}${startUrlObj.search}`;
                } else {
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
    },
    [checkWebManifest, getLoadingIcon, baseProxyUrl]
  );

  useEffect(() => {
    // Éviter les doubles appels en mode développement avec StrictMode
    if (urlProcessed.current) return;

    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    if (urlParam) {
      try {
        const url = decodeURIComponent(urlParam);
        if (url !== iframeSrc) {
          handleSubmit(url);
        }
        urlProcessed.current = true;
      } catch (error) {
        console.error("Error decoding URL parameter:", error);
      }
    }
  }, [handleSubmit, iframeSrc]);

  return {
    iframeSrc,
    showSearch,
    manifest,
    loadingIcon,
    handleSubmit,
  };
}
