import ReactThreeTestRenderer from "@react-three/test-renderer";
import { NavBar3D } from "./NavBar3D";

describe("NavBar3D", () => {
  it("renders a fallback loading label when no URL is available", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <NavBar3D
        position={[0, 0, 0]}
        pixelSize={1 / 800}
        width={1280}
        displayUrl={null}
        canGoBack={false}
        canGoForward={false}
        onBack={() => {}}
        onForward={() => {}}
        onReload={() => {}}
        onCopyUrl={() => {}}
        onNewTab={() => {}}
        onClose={() => {}}
      />,
    );

    expect(JSON.stringify(renderer.toGraph())).toContain("Loading…");
  });

  it("renders the hostname when a display URL is provided", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <NavBar3D
        position={[0, 0, 0]}
        pixelSize={1 / 800}
        width={1280}
        displayUrl="https://example.com/demo"
        canGoBack
        canGoForward
        onBack={() => {}}
        onForward={() => {}}
        onReload={() => {}}
        onCopyUrl={() => {}}
        onNewTab={() => {}}
        onClose={() => {}}
      />,
    );

    expect(JSON.stringify(renderer.toGraph())).toContain("example.com");
  });
});
