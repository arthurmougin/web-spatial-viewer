import chalk from "chalk";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// --- Infrastructure pour les Server-Sent Events (SSE) ---
const sseClients = new Map<string, Response>();

interface ProgressData {
  step: string;
  progress: number;
  message: string;
  duration?: number;
}

function sendProgress(pageId: string, data: ProgressData) {
  const client = sseClients.get(pageId);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

app.get("/events/:pageId", (req: Request, res: Response) => {
  const { pageId } = req.params;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*", // Ajout du header CORS
  });
  res.write("\n"); // Envoi initial pour ouvrir la connexion

  sseClients.set(pageId, res);
  console.log(chalk.cyan(`[SSE] Client connected for pageId: ${pageId}`));

  req.on("close", () => {
    sseClients.delete(pageId);
    console.log(chalk.cyan(`[SSE] Client disconnected for pageId: ${pageId}`));
  });
});
// --- Fin de l'infrastructure SSE ---

// Utilitaire pour reconstruire l'URL cible à partir du sous-domaine
function getTargetUrlFromHost(host: string, path: string): string | null {
  console.log(chalk.blue(`[Proxy] Resolving host: ${host}${path}`));
  // Ex: lofi-jingle-avp--vercel-app.localhost:3000 => lofi-jingle-avp.vercel.app
  const match = host.match(/^([^.]+)\.localhost(?::\d+)?$/);
  if (!match) {
    console.log(chalk.red(`[Proxy] Invalid host format: ${host}`));
    return null;
  }

  // Sépare le nom du site du domaine principal
  const parts = match[1].split("--");
  if (parts.length === 1) {
    // Cas simple : pas de séparation de domaine
    const targetUrl = `https://${parts[0].replace(/-/g, ".")}${path}`;
    console.log(chalk.green(`[Proxy] Resolved to target URL: ${targetUrl}`));
    return targetUrl;
  }

  // Cas avec séparation de domaine (ex: lofi-jingle-avp--vercel-app)
  const siteName = parts[0]; // garde les tirets pour les sous-parties du nom
  const domain = parts[1].replace(/-/g, ".");
  const targetUrl = `https://${siteName}.${domain}${path}`;
  console.log(chalk.green(`[Proxy] Resolved to target URL: ${targetUrl}`));
  return targetUrl;
}

export function proxyFyUrl(url: string): URL {
  console.log(chalk.cyan(`[Proxyfy URL] Original: ${url}`));
  const urlToProxify = new URL(url);
  // Séparer le nom de domaine principal des sous-domaines
  const parts = urlToProxify.hostname.split(".");
  const mainDomain = parts.slice(-2).join("-"); // ex: vercel-app
  const subParts = parts.slice(0, -2); // ex: ['lofi', 'jingle', 'avp']

  // Construire le sous-domaine pour le proxy
  const proxyHostname =
    subParts.length > 0 ? `${subParts.join("-")}--${mainDomain}` : mainDomain;

  const proxyPort = 3000;
  //is the server in prod environment?

  const isServerInProduction = process.env.NODE_ENV === "production";
  const proxyProtocol = isServerInProduction ? "https:" : "http:";
  const baseProxyUrl = `${proxyProtocol}//${proxyHostname}.localhost:${proxyPort}`;
  const proxyUrl = `${baseProxyUrl}${urlToProxify.pathname}${urlToProxify.search}`;
  console.log(chalk.cyan(`[Proxyfy URL] Proxied: ${proxyUrl}`));
  return new URL(proxyUrl);
}

// Servir le JS généré
app.use("/lib", express.static(path.join(__dirname, "../dist/lib")));

// Fonction de proxy pour les ressources
async function proxyResource(req: Request, res: Response) {
  const host = req.headers.host || "";
  const pageId = req.query.pageId as string | undefined;

  if (pageId) {
    sendProgress(pageId, {
      step: "RESOURCE_START",
      progress: 0,
      message: `Proxying resource: ${req.path}`,
    });
  }

  console.log(chalk.yellow(`\n[Proxy Resource] Request for: ${req.path}`));
  const targetUrl = getTargetUrlFromHost(host, req.path);
  if (!targetUrl) return res.status(400).send("Invalid host format");

  try {
    const fetch = (await import("node-fetch")).default;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      // Transférer les en-têtes importants
      "accept-language": req.headers["accept-language"] || "",
      accept: req.headers.accept || "*/*",
    };
    console.log(chalk.gray(`  > Fetching: ${targetUrl}`));
    if (pageId) {
      sendProgress(pageId, {
        step: "RESOURCE_FETCHING",
        progress: 50,
        message: `Fetching: ${targetUrl}`,
      });
    }
    const startTime = Date.now();
    const response = await fetch(targetUrl, {
      headers,
    });
    const duration = Date.now() - startTime;
    console.log(
      chalk.green(`  < Fetched in ${duration}ms. Status: ${response.status}`)
    );
    if (pageId) {
      sendProgress(pageId, {
        step: "RESOURCE_FETCHED",
        progress: 100,
        message: `Fetched in ${duration}ms. Status: ${response.status}`,
        duration,
      });
    }

    if (!response.ok) {
      console.log(chalk.red(`  ! Error: ${response.statusText}`));
      return res.status(response.status).send(response.statusText);
    }

    if (response.body) {
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";
      console.log(chalk.gray(`  > Content-Type: ${contentType}`));
      res.set("Content-Type", contentType);
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Headers", "*");
      response.body.pipe(res);
    } else {
      console.log(chalk.gray("  > No content in response."));
      res.status(204).send(); // No Content
    }
  } catch (error) {
    console.error(
      chalk.red("[Proxy Resource] Error fetching resource:"),
      error
    );
    res.status(500).send("Error fetching resource");
  }
}

// Route pour servir le HTML injecté (pour n'importe quel chemin de page)
app.get("*path", async (req: Request, res: Response, next) => {
  // On ne traite que les requêtes qui attendent du HTML
  const acceptHeader = req.headers.accept || "";
  if (!acceptHeader.includes("text/html")) {
    return next();
  }

  const pageId = req.query.pageId as string | undefined;
  if (pageId) {
    sendProgress(pageId, {
      step: "HTML_START",
      progress: 0,
      message: `Request for HTML: ${req.path}`,
    });
  }

  console.log(chalk.magenta(`\n[HTML Injector] Request for: ${req.path}`));
  const host = req.headers.host || "";
  const targetUrl = getTargetUrlFromHost(host, req.path);
  if (!targetUrl) return res.status(400).send("Invalid host format");
  const jsFileUrl = `/lib/spatial-viewer-bridge.js`;

  try {
    const fetch = (await import("node-fetch")).default;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept-language": req.headers["accept-language"] || "",
      accept: "text/html", // On force la demande de HTML
    };
    console.log(chalk.gray(`  > Fetching HTML from: ${targetUrl}`));
    if (pageId) {
      sendProgress(pageId, {
        step: "HTML_FETCHING",
        progress: 25,
        message: `Fetching HTML from: ${targetUrl}`,
      });
    }
    const startTime = Date.now();
    const response = await fetch(targetUrl, {
      headers,
    });
    const duration = Date.now() - startTime;
    console.log(
      chalk.green(
        `  < Fetched HTML in ${duration}ms. Status: ${response.status}`
      )
    );
    if (pageId) {
      sendProgress(pageId, {
        step: "HTML_FETCHED",
        progress: 50,
        message: `Fetched HTML in ${duration}ms. Status: ${response.status}`,
        duration,
      });
    }

    if (!response.ok) {
      // Si la page n'est pas trouvée, on passe au proxy de ressource
      // car ça pourrait être un fichier avec une extension non reconnue comme .json
      if (response.status === 404) {
        console.log(
          chalk.yellow("  ! HTML not found, attempting to proxy as a resource.")
        );
        return proxyResource(req, res);
      }
      console.log(chalk.red(`  ! Error: ${response.statusText}`));
      return res.status(response.status).send(response.statusText);
    }

    let html = await response.text();
    console.log(chalk.gray("  > Injecting bridge script..."));
    if (pageId) {
      sendProgress(pageId, {
        step: "HTML_PROCESSING",
        progress: 75,
        message: "Injecting bridge script and rewriting URLs...",
      });
    }
    // Injection du JS avant </head>
    html = html.replace(
      /<\/head>/i,
      `<script src="${jsFileUrl}" type="module"></script></head>`
    );

    /** replace any url in html with proxyFyUrl */
    const urlRegex =
      /(<meta[^>]+content=["'])(https?:\/\/[^"']+)(["'][^>]*>)/gi;
    html = html.replace(urlRegex, (match, p1, p2, p3) => {
      console.log(chalk.gray(`  > Replacing URL in meta tag: ${p2}`));
      const proxiedUrl = proxyFyUrl(p2).toString();
      return `${p1}${proxiedUrl}${p3}`;
    });

    // Regex pour les attributs src, href, action
    const commonAttributesRegex =
      /\s(href|src|action)=["'](https?:\/\/[^"']+)["']/gi;
    html = html.replace(commonAttributesRegex, (match, attr, url) => {
      console.log(chalk.gray(`  > Replacing URL in ${attr}: ${url}`));
      const proxiedUrl = proxyFyUrl(url).toString();
      return ` ${attr}="${proxiedUrl}"`;
    });

    // Regex pour l'attribut srcset (images responsives)
    const srcsetRegex = /\s(srcset)=["']([^"']+)["']/gi;
    html = html.replace(srcsetRegex, (match, attr, srcset) => {
      console.log(chalk.gray(`  > Replacing URLs in srcset...`));
      const newSrcset = srcset
        .split(",")
        .map((part: string) => {
          const trimmedPart = part.trim();
          const [url, descriptor] = trimmedPart.split(/\s+/);
          if (url.startsWith("http://") || url.startsWith("https://")) {
            const proxiedUrl = proxyFyUrl(url).toString();
            return `${proxiedUrl} ${descriptor || ""}`.trim();
          }
          return trimmedPart; // Ne modifie pas les URLs relatives
        })
        .join(", ");
      return ` ${attr}="${newSrcset}"`;
    });

    if (pageId) {
      sendProgress(pageId, {
        step: "HTML_COMPLETE",
        progress: 100,
        message: "HTML processing complete. Sending to client.",
      });
    }
    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error(
      chalk.red("[HTML Injector] Error fetching target URL:"),
      error
    );
    res.status(500).send("Error fetching target URL");
  }
});

// Middleware pour proxyfier toutes les autres requêtes (ressources)
app.use(proxyResource);

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
