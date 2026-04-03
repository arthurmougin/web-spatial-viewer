import { describe, expect, it, vi } from "vitest";
import { proxyFyUrl, UnProxyFyUrl } from "../../utils/proxy.utils";

// In happy-dom, window.location.protocol defaults to "http:".
// proxyFyUrl reads this to decide the proxy scheme.

describe("proxyFyUrl", () => {
  it("returns null for an empty string", () => {
    expect(proxyFyUrl("")).toBeNull();
  });

  it("proxifies a simple two-part domain", () => {
    const result = proxyFyUrl("https://google.com");
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe("google-com.localhost");
    expect(result!.port).toBe("47891");
    expect(result!.protocol).toBe("http:");
  });

  it("proxifies a URL with a subdomain", () => {
    const result = proxyFyUrl("https://www.google.com");
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe("www--google-com.localhost");
  });

  it("proxifies a deep subdomain", () => {
    // lofi.jingle.avp.vercel.app → lofi-jingle-avp--vercel-app.localhost:47891
    const result = proxyFyUrl("https://lofi.jingle.avp.vercel.app");
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe("lofi-jingle-avp--vercel-app.localhost");
  });

  it("preserves path and query string", () => {
    const result = proxyFyUrl("https://www.google.com/search?q=test&lang=fr");
    expect(result).not.toBeNull();
    expect(result!.pathname).toBe("/search");
    expect(result!.searchParams.get("q")).toBe("test");
    expect(result!.searchParams.get("lang")).toBe("fr");
  });

  it("appends pageId as a query parameter when provided", () => {
    const result = proxyFyUrl("https://lofi.cafe", 12345);
    expect(result).not.toBeNull();
    expect(result!.searchParams.get("pageId")).toBe("12345");
  });

  it("does not append pageId when not provided", () => {
    const result = proxyFyUrl("https://lofi.cafe");
    expect(result).not.toBeNull();
    expect(result!.searchParams.has("pageId")).toBe(false);
  });

  it("uses https: scheme when window.location is https", () => {
    vi.stubGlobal("location", {
      ...window.location,
      protocol: "https:",
    });
    const result = proxyFyUrl("https://lofi.cafe");
    expect(result!.protocol).toBe("https:");
    vi.unstubAllGlobals();
  });

  it("uses http: scheme when window.location is http (default in tests)", () => {
    const result = proxyFyUrl("https://lofi.cafe");
    expect(result!.protocol).toBe("http:");
  });
});

describe("UnProxyFyUrl", () => {
  it("returns null for null input", () => {
    expect(UnProxyFyUrl(null as unknown as string)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(UnProxyFyUrl("")).toBeNull();
  });

  it("unproxifies a simple domain (string input)", () => {
    const result = UnProxyFyUrl("http://google-com.localhost:47891/");
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe("google.com");
    expect(result!.protocol).toBe("https:");
  });

  it("unproxifies a URL with a subdomain (double-dash separator)", () => {
    const result = UnProxyFyUrl(
      "http://www--google-com.localhost:47891/search?q=test",
    );
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe("www.google.com");
    expect(result!.pathname).toBe("/search");
    expect(result!.searchParams.get("q")).toBe("test");
  });

  it("unproxifies a deep subdomain", () => {
    const result = UnProxyFyUrl(
      "http://lofi-jingle-avp--vercel-app.localhost:47891/",
    );
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe("lofi-jingle-avp.vercel.app");
  });

  it("accepts a URL object as input", () => {
    const input = new URL("http://lofi-cafe.localhost:47891/");
    const result = UnProxyFyUrl(input);
    expect(result).not.toBeNull();
    expect(result!.hostname).toBe("lofi.cafe");
  });

  it("returns the original URL unchanged when the host is not a localhost proxy", () => {
    // A URL that doesn't match the proxy pattern passes through as-is
    const result = UnProxyFyUrl("https://lofi.cafe/real-page");
    expect(result).not.toBeNull();
    expect(result!.href).toBe("https://lofi.cafe/real-page");
  });

  it("roundtrip: proxyFyUrl → UnProxyFyUrl restores the original hostname", () => {
    const original = "https://lofi.cafe";
    const proxied = proxyFyUrl(original)!;
    const restored = UnProxyFyUrl(proxied)!;
    expect(restored.hostname).toBe("lofi.cafe");
    expect(restored.protocol).toBe("https:");
  });

  it("roundtrip: preserves pathname and query through proxy/unproxy cycle", () => {
    const original = "https://www.google.com/search?q=spatial";
    const proxied = proxyFyUrl(original)!;
    const restored = UnProxyFyUrl(proxied)!;
    expect(restored.hostname).toBe("www.google.com");
    expect(restored.pathname).toBe("/search");
    expect(restored.searchParams.get("q")).toBe("spatial");
  });

  // ─── Known limitation ───────────────────────────────────────────────────
  // Domains whose BASE name contains hyphens (e.g. my-app.com) cannot be
  // roundtripped: the hyphen is indistinguishable from the sub-domain separator.
  // proxyFyUrl('https://my-app.com') → 'http://my-app-com.localhost:47891'
  // UnProxyFyUrl  → 'https://my.app.com' (wrong — hyphens become dots)
  it("KNOWN LIMITATION — base domain with hyphen decodes incorrectly", () => {
    const proxied = proxyFyUrl("https://my-app.com")!;
    const restored = UnProxyFyUrl(proxied)!;
    // Documents the bug: hostname should be 'my-app.com' but becomes 'my.app.com'
    expect(restored.hostname).not.toBe("my-app.com");
    expect(restored.hostname).toBe("my.app.com");
  });
});
