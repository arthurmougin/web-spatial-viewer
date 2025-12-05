import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Utilitaire pour reconstruire l'URL cible à partir du sous-domaine
function getTargetUrlFromHost(host: string, path: string): string | null {
  // Ex: lofi-jingle-avp--vercel-app.localhost:3000 => lofi-jingle-avp.vercel.app
  const match = host.match(/^([^.]+)\.localhost(?::\d+)?$/);
  if (!match) return null;

  // Sépare le nom du site du domaine principal
  const parts = match[1].split("--");
  if (parts.length === 1) {
    // Cas simple : pas de séparation de domaine
    return `https://${parts[0].replace(/-/g, ".")}${path}`;
  }

  // Cas avec séparation de domaine (ex: lofi-jingle-avp--vercel-app)
  const siteName = parts[0]; // garde les tirets pour les sous-parties du nom
  const domain = parts[1].replace(/-/g, ".");
  return `https://${siteName}.${domain}${path}`;
}

// Servir le JS généré
app.use("/lib", express.static(path.join(__dirname, "../dist/lib")));

// Fonction de proxy pour les ressources
async function proxyResource(req: Request, res: Response) {
  console.log("Proxying resource for:", req.path);
  const host = req.headers.host || "";
  const targetUrl = getTargetUrlFromHost(host, req.path);
  if (!targetUrl) return res.status(400).send("Invalid host format");

  try {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        // Transférer les en-têtes importants
        "accept-language": req.headers["accept-language"] || "",
        accept: req.headers.accept || "*/*",
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(response.statusText);
    }

    if (response.body) {
      res.set(
        "Content-Type",
        response.headers.get("content-type") || "application/octet-stream"
      );
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Headers", "*");
      response.body.pipe(res);
    } else {
      res.status(204).send(); // No Content
    }
  } catch (error) {
    console.error("Error fetching resource:", error);
    res.status(500).send("Error fetching resource");
  }
}

// Route pour servir le HTML injecté (pour n'importe quel chemin de page)
app.get('*path', async (req: Request, res: Response, next) => {
  // On ne traite que les requêtes qui attendent du HTML
  const acceptHeader = req.headers.accept || "";
  if (!acceptHeader.includes("text/html")) {
    return next();
  }

  console.log("Serving proxied HTML for:", req.path);
  const host = req.headers.host || "";
  const targetUrl = getTargetUrlFromHost(host, req.path);
  if (!targetUrl) return res.status(400).send("Invalid host format");

  console.log(req) 
  const jsFileUrl = `/lib/spatial-viewer-bridge.js`;

  try {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept-language": req.headers["accept-language"] || "",
        accept: "text/html", // On force la demande de HTML
      },
    });

    if (!response.ok) {
      // Si la page n'est pas trouvée, on passe au proxy de ressource
      // car ça pourrait être un fichier avec une extension non reconnue comme .json
      if (response.status === 404) {
        return proxyResource(req, res);
      }
      return res.status(response.status).send(response.statusText);
    }

    let html = await response.text();
    // Injection du JS avant </body>
    html = html.replace(
      /<\/body>/i,
      `<script src="${jsFileUrl}" type="module"></script></body>`
    );
    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Error fetching target URL:", error);
    res.status(500).send("Error fetching target URL");
  }
});

// Middleware pour proxyfier toutes les autres requêtes (ressources)
app.use(proxyResource);

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
