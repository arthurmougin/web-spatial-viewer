import request from "supertest";
import {
  createApp,
  getTargetUrlFromHost,
  getRequestTargetPath,
  injectBridgeScript,
  rewriteAbsoluteUrlsInHtml,
} from "./server";

function createFetchResponse({
  ok = true,
  status = 200,
  statusText = "OK",
  contentType = "text/html",
  bodyText = "<html><head></head><body>Hello</body></html>",
}: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  contentType?: string;
  bodyText?: string;
}) {
  return {
    ok,
    status,
    statusText,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? contentType : null,
    },
    body: null,
    text: async () => bodyText,
  };
}

describe("server helpers", () => {
  it("resolves a proxified host to its target URL", () => {
    expect(
      getTargetUrlFromHost(
        "lofi-jingle-avp--vercel-app.localhost:3000",
        "/demo?foo=bar",
      ),
    ).toBe("https://lofi-jingle-avp.vercel.app/demo?foo=bar");
  });

  it("injects the bridge script before </head>", () => {
    expect(injectBridgeScript("<html><head></head><body></body></html>")).toContain(
      '<script src="/lib/spatial-viewer-bridge.js" type="module"></script></head>',
    );
  });

  it("rewrites absolute URLs in HTML to proxified URLs", () => {
    const rewritten = rewriteAbsoluteUrlsInHtml(
      '<a href="https://example.com/demo">demo</a>',
    );
    expect(rewritten).toContain("http://example-com.localhost:3000/demo");
  });
});

describe("createApp", () => {
  it("exposes the SSE endpoint", async () => {
    const app = createApp({
      fetchImpl: vi.fn(),
    });

    const response = await request(app).get("/events/abc");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
  });

  it("injects the bridge script into fetched HTML", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createFetchResponse({
        bodyText:
          '<html><head></head><body><a href="https://example.com/demo">Demo</a></body></html>',
      }),
    );

    const app = createApp({ fetchImpl });

    const response = await request(app)
      .get("/demo?pageId=42")
      .set("Host", "lofi-jingle-avp--vercel-app.localhost:3000")
      .set("Accept", "text/html");

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalled();
    expect(response.text).toContain("/lib/spatial-viewer-bridge.js");
    expect(response.text).toContain("http://example-com.localhost:3000/demo");
  });

  it("builds the target path without leaking pageId", () => {
    const req = {
      originalUrl: "/demo?foo=bar&pageId=42",
      path: "/demo",
    } as never;

    expect(getRequestTargetPath(req)).toBe("/demo?foo=bar");
  });
});
