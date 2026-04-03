import { FetchManifest, getLoadingIcon, isUrlInScope } from "./pwa.utils";

describe("pwa.utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes relative icon URLs from the manifest URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          name: "Demo App",
          display: "standalone",
          start_url: "/",
          background_color: "#ffffff",
          theme_color: "#000000",
          icons: [{ src: "./icons/app.png", sizes: "512x512", purpose: "any" }],
        }),
      }),
    );

    const manifest = await FetchManifest(
      "https://example.com/app/manifest.webmanifest",
    );

    expect(manifest?.icons?.[0].src).toBe(
      "https://example.com/app/icons/app.png",
    );
  });

  it("returns null when the manifest fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await expect(
      FetchManifest("https://example.com/manifest.webmanifest"),
    ).resolves.toBeNull();
  });

  it("checks whether a URL is within scope", () => {
    expect(
      isUrlInScope(
        "https://example.com/app/room",
        "/app/",
        "https://example.com/app/",
      ),
    ).toBe(true);

    expect(
      isUrlInScope(
        "https://example.com/other",
        "/app/",
        "https://example.com/app/",
      ),
    ).toBe(false);
  });

  it("prefers a large maskable icon for loading", () => {
    const icon = getLoadingIcon([
      { src: "https://example.com/any.png", sizes: "512x512", purpose: "any" },
      {
        src: "https://example.com/maskable.png",
        sizes: "1024x1024",
        purpose: "maskable",
      },
    ]);

    expect(icon).toBe("https://example.com/maskable.png");
  });
});
