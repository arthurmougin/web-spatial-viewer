export function proxyFyUrl(url: string, pageId?: number): URL {
  const currentUrl = new URL(url);
  // Séparer le nom de domaine principal des sous-domaines
  const parts = currentUrl.hostname.split(".");
  const mainDomain = parts.slice(-2).join("-"); // ex: vercel-app
  const subParts = parts.slice(0, -2); // ex: ['lofi', 'jingle', 'avp']

  // Construire le sous-domaine pour le proxy
  const proxyHostname =
    subParts.length > 0 ? `${subParts.join("-")}--${mainDomain}` : mainDomain;

  const proxyPort = 3000;
  const isSSL = window.location.protocol === "https:";
  const proxyProtocol = isSSL ? "https:" : "http:";
  const baseProxyUrl = `${proxyProtocol}//${proxyHostname}.localhost:${proxyPort}`;

  // Ajout du pageId si fourni
  const searchParams = new URLSearchParams(currentUrl.search);
  if (pageId) {
    searchParams.set("pageId", pageId.toString());
  }
  const searchString = searchParams.toString()
    ? `?${searchParams.toString()}`
    : "";

  const proxyUrl = `${baseProxyUrl}${currentUrl.pathname}${searchString}`;
  return new URL(proxyUrl);
}

export function UnProxyFyUrl(proxyUrl: URL | string): URL {
  if (!proxyUrl) throw new Error("URL invalide :" + proxyUrl);
  if (typeof proxyUrl === "string") proxyUrl = new URL(proxyUrl);
  const { hostname, pathname, search } = proxyUrl;
  // Ex: lofi-jingle-avp--vercel-app.localhost:3000
  const match = hostname.match(/^([^.]+)\.localhost(?::\d+)?$/);
  if (!match) return proxyUrl;

  // Sépare le nom du site du domaine principal
  const parts = match[1].split("--");
  if (parts.length === 1) {
    // Cas simple : pas de séparation de domaine
    return new URL(
      `https://${parts[0].replace(/-/g, ".")}${pathname}${search}`
    );
  }

  // Cas avec séparation de domaine (ex: lofi-jingle-avp--vercel-app)
  const siteName = parts[0]; // garde les tirets pour les sous-parties du nom
  const domain = parts[1].replace(/-/g, ".");
  return new URL(`https://${siteName}.${domain}${pathname}${search}`);
}
