/**
 * Tests for the PWA utils with mocked fetch.
 *
 * FetchManifest requires fetch, which is mocked out in happy-dom using vi.stubGlobal.
 * We test: URL absolutization, icon path handling, and error cases.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FetchManifest, checkWebManifest, isUrlInScope, getLoadingIcon } from "../../utils/pwa.utils";
import type { WebManifest, WebManifestIcon } from "../../../types/pwa";

beforeEach(() => {
  // Reset fetch mocks between tests
  vi.unstubAllGlobals();
});

describe("FetchManifest", () => {
  it("returns null when the response is not ok (404)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));
    const result = await FetchManifest("https://lofi.cafe/manifest.webmanifest");
    expect(result).toBeNull();
  });

  it("parses the manifest for a successful response", async () => {
    const mockManifest = {
      name: "Lofi Cafe",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" as const },
      ],
    } as unknown as WebManifest;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockManifest),
    }));
    const result = await FetchManifest("https://lofi.cafe/manifest.webmanifest");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Lofi Cafe");
  });

  it("converts relative icon paths to absolute URLs", async () => {
    const mockManifest = {
      name: "Test App",
      icons: [
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" as const },
      ],
    } as unknown as WebManifest;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockManifest),
    }));
    const result = await FetchManifest("https://lofi.cafe/manifest.webmanifest");
    expect(result!.icons?.[0].src).toBe("https://lofi.cafe/icon-512.png");
  });

  it("handles root-relative paths starting with /", async () => {
    const mockManifest = {
      name: "Test",
      icons: [
        { src: "icon.png", sizes: "48x48", type: "image/png" as const },
      ],
    } as unknown as WebManifest;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockManifest),
    }));
    const result = await FetchManifest("https://lofi.cafe/manifest.webmanifest");
    // icon.png relative to https://lofi.cafe/manifest.webmanifest → https://lofi.cafe/icon.png
    expect(result!.icons?.[0].src).toBe("https://lofi.cafe/icon.png");
  });

  it("handles manifest hosted in a subdirectory", async () => {
    const mockManifest = {
      name: "Subdomain Manifest",
      icons: [
        { src: "images/icon.png", sizes: "48x48", type: "image/png" as const },
      ],
    } as unknown as WebManifest;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockManifest),
    }));
    const result = await FetchManifest("https://lofi.cafe/app/manifest.webmanifest");
    expect(result!.icons?.[0].src).toBe("https://lofi.cafe/app/images/icon.png");
  });
});

describe("checkWebManifest", () => {
  it("returns null when the manifest response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const result = await checkWebManifest("http://lofi-cafe.localhost:3000");
    expect(result).toBeNull();
  });

  it("converts relative icon paths to absolute URLs", async () => {
    const mockManifest = {
      name: "Test",
      icons: [
        { src: "/icon.png", sizes: "192x192", type: "image/png" as const },
      ],
    } as unknown as WebManifest;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockManifest),
    }));
    const result = await checkWebManifest("http://lofi-cafe.localhost:3000");
    expect(result).not.toBeNull();
    expect(result!.icons?.[0].src).toBe("http://lofi-cafe.localhost:3000/icon.png");
  });

  it("warns when required icons are missing (any + maskable 1024x1024)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockManifest = {
      name: "Test",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" as const, purpose: "any" },
      ],
    } as unknown as WebManifest;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockManifest),
    }));
    await checkWebManifest("http://lofi-cafe.localhost:3000");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Il manque des icônes requises"));
    warnSpy.mockRestore();
  });

  it("defaults scope to the parent of start_url when scope is missing", async () => {
    const mockManifest = {
      name: "Test",
      start_url: "/app/index.html",
      icons: [],
    } as unknown as WebManifest;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockManifest),
    }));
    const result = await checkWebManifest("http://lofi-cafe.localhost:3000");
    expect(result!.scope).toBe("/app/");
  });
});

describe("isUrlInScope", () => {
  it("returns true when URL is within scope", () => {
    expect(isUrlInScope(
      "https://lofi.cafe/app/page",
      "/app/",
      "https://lofi.cafe"
    )).toBe(true);
  });

  it("returns false when URL is outside scope", () => {
    expect(isUrlInScope(
      "https://lofi.cafe/other/page",
      "/app/",
      "https://lofi.cafe"
    )).toBe(false);
  });

  it("returns false for malformed URLs", () => {
    expect(isUrlInScope(
      "not-a-url",
      "/app/",
      "https://lofi.cafe"
    )).toBe(false);
  });
});

describe("getLoadingIcon", () => {
  it("prioritizes a maskable icon ≥512px", () => {
    const icons = [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" as const, purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png" as const, purpose: "maskable" },
    ] as const;
    const result = getLoadingIcon(icons as unknown as WebManifestIcon[]);
    expect(result).toBe("/icon-512-maskable.png");
  });

  it("falls back to the largest icon when no maskable ≥512px exists", () => {
    const icons = [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" as const, purpose: "any" },
      { src: "/icon-256.png", sizes: "256x256", type: "image/png" as const, purpose: "any" },
      { src: "/icon-128-maskable.png", sizes: "128x128", type: "image/png" as const, purpose: "maskable" },
    ] as const;
    const result = getLoadingIcon(icons as unknown as WebManifestIcon[]);
    expect(result).toBe("/icon-256.png");
  });

  it("returns null when no icons are provided", () => {
    expect(getLoadingIcon([])).toBeNull();
  });
});
