import { proxyFyUrl, UnProxyFyUrl } from "./proxy.utils";

describe("proxy.utils", () => {
  it("proxifies a URL and preserves pathname + query + pageId", () => {
    Object.defineProperty(window, "location", {
      value: { protocol: "http:" },
      writable: true,
    });

    const proxied = proxyFyUrl(
      "https://lofi-jingle-avp.vercel.app/demo?foo=bar",
      42,
    );

    expect(proxied?.toString()).toBe(
      "http://lofi-jingle-avp--vercel-app.localhost:3000/demo?foo=bar&pageId=42",
    );
  });

  it("returns null when proxifying an empty URL", () => {
    expect(proxyFyUrl("")).toBeNull();
  });

  it("unproxifies a proxied URL back to its original target", () => {
    const original = UnProxyFyUrl(
      "http://lofi-jingle-avp--vercel-app.localhost:3000/demo?foo=bar&pageId=42",
    );

    expect(original?.toString()).toBe(
      "https://lofi-jingle-avp.vercel.app/demo?foo=bar&pageId=42",
    );
  });

  it("returns the input URL when hostname is not proxified", () => {
    const passthrough = UnProxyFyUrl("https://example.com/path?q=1");
    expect(passthrough?.toString()).toBe("https://example.com/path?q=1");
  });
});
