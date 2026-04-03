import chalk from "chalk";
import express, { Request, Response, type Express } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_PORT = 47891;
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const BRIDGE_FILE_URL = "/lib/spatial-viewer-bridge.js";

interface ResponseBodyLike {
  pipe(destination: Response): void;
}

interface FetchResponseLike {
  ok: boolean;
  status: number;
  statusText: string;
  headers: {
    get(name: string): string | null;
  };
  body: ResponseBodyLike | null;
  text(): Promise<string>;
}

type FetchLike = (
  url: string,
  init?: {
    headers?: Record<string, string>;
  },
) => Promise<FetchResponseLike>;

export interface ProgressData {
  step: string;
  progress: number;
  message: string;
  duration?: number;
}

async function loadDefaultFetch(): Promise<FetchLike> {
  return (await import("node-fetch")).default as unknown as FetchLike;
}

function createProgressSender(sseClients: Map<string, Response>) {
  return (pageId: string, data: ProgressData) => {
    const client = sseClients.get(pageId);
    if (client) {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };
}

function getRequestSearchParams(req: Request): URLSearchParams {
  const url = new URL(req.originalUrl, "http://localhost");
  return url.searchParams;
}

export function getRequestTargetPath(req: Request): string {
  const searchParams = getRequestSearchParams(req);
  searchParams.delete("pageId");
  const search = searchParams.toString();
  return `${req.path}${search ? `?${search}` : ""}`;
}

export function getTargetUrlFromHost(
  host: string,
  requestPath: string,
): string | null {
  console.log(chalk.blue(`[Proxy] Resolving host: ${host}${requestPath}`));
  const match = host.match(/^([^.]+)\.localhost(?::\d+)?$/);
  if (!match) {
    console.log(chalk.red(`[Proxy] Invalid host format: ${host}`));
    return null;
  }
  if (!match) {
    console.log(chalk.red(`[Proxy] Invalid host format: ${host}`));
    return null;
  }

  const parts = match[1].split("--");
  if (parts.length === 1) {
    const targetUrl = `https://${parts[0].replace(/-/g, ".")}${requestPath}`;
    console.log(chalk.green(`[Proxy] Resolved to target URL: ${targetUrl}`));
    return targetUrl;
  }

  const siteName = parts[0];
  const domain = parts[1].replace(/-/g, ".");
  const targetUrl = `https://${siteName}.${domain}${requestPath}`;
  console.log(chalk.green(`[Proxy] Resolved to target URL: ${targetUrl}`));
  return targetUrl;
}

export function proxyFyUrl(url: string, port = DEFAULT_PORT): URL {
  console.log(chalk.cyan(`[Proxyfy URL] Original: ${url}`));
  const urlToProxify = new URL(url);
  const parts = urlToProxify.hostname.split(".");
  const mainDomain = parts.slice(-2).join("-");
  const subParts = parts.slice(0, -2);

  const proxyHostname =
    subParts.length > 0 ? `${subParts.join("-")}--${mainDomain}` : mainDomain;

  const isServerInProduction = process.env.NODE_ENV === "production";
  const proxyProtocol = isServerInProduction ? "https:" : "http:";
  const baseProxyUrl = `${proxyProtocol}//${proxyHostname}.localhost:${port}`;
  const proxyUrl = `${baseProxyUrl}${urlToProxify.pathname}${urlToProxify.search}`;
  console.log(chalk.cyan(`[Proxyfy URL] Proxied: ${proxyUrl}`));
  return new URL(proxyUrl);
}

export function injectBridgeScript(
  html: string,
  jsFileUrl = BRIDGE_FILE_URL,
): string {
  return html.replace(
    /<\/head>/i,
    `<script src="${jsFileUrl}" type="module"></script></head>`,
  );
}

export function rewriteAbsoluteUrlsInHtml(html: string): string {
  const urlRegex = /["'\s=](https?:\/\/[^"'\\s&]+)["'\s&]?/g;
  return html.replace(urlRegex, (_match, url) => {
    console.log(chalk.gray(`  > Replacing URL: ${url}`));
    const proxiedUrl = proxyFyUrl(url).toString();
    return `"${proxiedUrl}"`;
  });
}

export function createApp(
  options: {
    fetchImpl?: FetchLike;
    port?: number;
  } = {},
): Express {
  const app = express();
  const port = options.port ?? DEFAULT_PORT;
  const sseClients = new Map<string, Response>();
  const sendProgress = createProgressSender(sseClients);
  let fetchImpl = options.fetchImpl;

  const resolveFetch = async () => {
    if (!fetchImpl) {
      fetchImpl = await loadDefaultFetch();
    }
    return fetchImpl;
  };

  app.get("/events/:pageId", (req: Request, res: Response) => {
    const { pageId } = req.params;
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write("\n");

    sseClients.set(pageId, res);
    console.log(chalk.cyan(`[SSE] Client connected for pageId: ${pageId}`));

    req.on("close", () => {
      sseClients.delete(pageId);
      console.log(
        chalk.cyan(`[SSE] Client disconnected for pageId: ${pageId}`),
      );
    });
  });

  app.use("/lib", express.static(path.join(__dirname, "../dist/lib")));

  async function proxyResource(req: Request, res: Response) {
    const host = req.headers.host || "";
    const pageId = getRequestSearchParams(req).get("pageId") ?? undefined;
    const requestTargetPath = getRequestTargetPath(req);

    if (pageId) {
      sendProgress(pageId, {
        step: "RESOURCE_START",
        progress: 0,
        message: `Proxying resource: ${requestTargetPath}`,
      });
    }

    console.log(
      chalk.yellow(`\n[Proxy Resource] Request for: ${requestTargetPath}`),
    );
    const targetUrl = getTargetUrlFromHost(host, requestTargetPath);
    if (!targetUrl) {
      return res.status(400).send("Invalid host format");
    }

    try {
      const fetch = await resolveFetch();
      const headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "accept-language": String(req.headers["accept-language"] || ""),
        accept: String(req.headers.accept || "*/*"),
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
      const response = await fetch(targetUrl, { headers });
      const duration = Date.now() - startTime;
      console.log(
        chalk.green(`  < Fetched in ${duration}ms. Status: ${response.status}`),
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
        res.status(204).send();
      }
    } catch (error) {
      console.error(
        chalk.red("[Proxy Resource] Error fetching resource:"),
        error,
      );
      res.status(500).send("Error fetching resource");
    }
  }

  app.get("*path", async (req: Request, res: Response, next) => {
    const acceptHeader = req.headers.accept || "";
    if (!acceptHeader.includes("text/html")) {
      return next();
    }

    const pageId = getRequestSearchParams(req).get("pageId") ?? undefined;
    const requestTargetPath = getRequestTargetPath(req);
    if (pageId) {
      sendProgress(pageId, {
        step: "HTML_START",
        progress: 0,
        message: `Request for HTML: ${requestTargetPath}`,
      });
    }

    console.log(
      chalk.magenta(`\n[HTML Injector] Request for: ${requestTargetPath}`),
    );
    const host = req.headers.host || "";
    const targetUrl = getTargetUrlFromHost(host, requestTargetPath);
    if (!targetUrl) {
      return res.status(400).send("Invalid host format");
    }

    try {
      const fetch = await resolveFetch();
      const headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "accept-language": String(req.headers["accept-language"] || ""),
        accept: "text/html",
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
      const response = await fetch(targetUrl, { headers });
      const duration = Date.now() - startTime;
      console.log(
        chalk.green(
          `  < Fetched HTML in ${duration}ms. Status: ${response.status}`,
        ),
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
        if (response.status === 404) {
          console.log(
            chalk.yellow(
              "  ! HTML not found, attempting to proxy as a resource.",
            ),
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

      html = injectBridgeScript(html);
      html = rewriteAbsoluteUrlsInHtml(html);

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
        error,
      );
      res.status(500).send("Error fetching target URL");
    }
  });

  app.use(proxyResource);

  return app;
}

export function startServer(port = DEFAULT_PORT) {
  const app = createApp({ port });
  return app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
  });
}

if (process.env.VITEST !== "true") {
  startServer();
}
