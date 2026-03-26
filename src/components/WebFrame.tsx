import { Html } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { BridgeMessageType } from "../../types/bridge";
import { usePagesStore } from "../store/pages.store";
import { usePWAStore } from "../store/pwa.store";
import { UnProxyFyUrl } from "../utils/proxy.utils";
import { NAV_BAR_HEIGHT, NavBar3D } from "./NavBar3D";
import "./RoundedPlaneGeometry";
import { Progress } from "./ui/progress";

const DEFAULT_FRAME_SIZE = {
  width: 1280,
  height: 720,
};

const NAV_AREA_HEIGHT = 52; // 44px bar + 8px gap

interface FrameSize {
  width: number;
  height: number;
}

interface WebFrameProps {
  id: number;
  position?: [number, number, number];
}

export function WebFrame({ id, position = [5, 0, 0] }: WebFrameProps) {
  const [page, progressData] = usePagesStore(
    useShallow((state) => [
      state.getPage(id),
      state.getPage(id)?.progressData || null,
    ]),
  );
  const removePage = usePagesStore((state) => state.removePage);
  const [progress, setProgress] = useState<number>(0);

  const canGoBack = (page?.historyIndex ?? 0) > 0;
  const canGoForward =
    (page?.historyIndex ?? 0) < (page?.history.length ?? 1) - 1;

  const manifest = usePWAStore((state) => state.manifest);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const splashScreenRef = useRef<HTMLDivElement>(null);
  const [localShowSplash, setLocalShowSplash] = useState(true);
  const niceUrl = useRef(page?.url ? UnProxyFyUrl(page?.url) : null);

  const [frameSize, setFrameSize] = useState<FrameSize>(DEFAULT_FRAME_SIZE);

  // Blur iframe while OrbitControls is active (scene rotation)
  useEffect(() => {
    const handleMouseDown = () => {
      if (iframeRef.current) {
        iframeRef.current.classList.add("blurred");
      }
    };

    const handleMouseUp = () => {
      if (iframeRef.current) {
        iframeRef.current.classList.remove("blurred");
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Bind the page listener to this iframe
  useEffect(() => {
    page?.pageListener.setIframe(iframeRef);
    niceUrl.current = UnProxyFyUrl(page?.url || "");
  }, [page, id]);

  // Apply xr_main_scene frame size from PWA manifest
  useEffect(() => {
    if (
      manifest &&
      manifest.xr_main_scene &&
      manifest.xr_main_scene.default_size
    ) {
      setFrameSize(manifest.xr_main_scene.default_size);
    }
  }, [manifest]);

  // Dismiss splash screen once page reports NETWORK_IDLE
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!page?.showSplash && localShowSplash) {
      splashScreenRef.current?.classList.add("hidden");
      timer = setTimeout(() => {
        setLocalShowSplash(false);
      }, 1000);
    }
    return () => (timer ? clearTimeout(timer) : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.showSplash]);

  // Drive the splash progress bar via SSE data
  useEffect(() => {
    if (progressData) {
      setProgress(progressData.progress);
    }
  }, [progressData]);

  // --- NavBar action handlers ---

  const handleReload = () => {
    if (iframeRef.current && page?.url) {
      // Reassigning src triggers a full reload through the proxy
      iframeRef.current.src = page.url;
    }
  };

  const handleBack = () => {
    page?.pageListener.sendMessage({
      type: BridgeMessageType.GO_BACK,
      id: page.id,
      data: null,
    });
  };

  const handleForward = () => {
    page?.pageListener.sendMessage({
      type: BridgeMessageType.GO_FORWARD,
      id: page.id,
      data: null,
    });
  };

  const handleCopyUrl = () => {
    const url = niceUrl.current?.href || page?.url || "";
    navigator.clipboard.writeText(url).catch(() => {
      /* clipboard may be unavailable in some contexts */
    });
  };

  const handleClose = () => {
    if (page?.url) {
      try {
        removePage(new URL(page.url));
      } catch {
        /* invalid URL — ignore */
      }
    }
  };

  const handleNewTab = () => {
    const url = niceUrl.current?.href;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const isSecure = niceUrl.current?.protocol === "https:";
  const totalHeight = frameSize.height + NAV_AREA_HEIGHT;
  // World-space Y positions (1 uikit pixel = 1/800 world units)
  // Combined frame center is the group origin (y=0).
  const navBarCenterY = (totalHeight / 2 - NAV_BAR_HEIGHT / 2) / 800;
  const iframeCenterY = -(NAV_AREA_HEIGHT / 2) / 800;

  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* 3D browser chrome — rendered in WebGL via @react-three/uikit */}
      <NavBar3D
        position={[0, navBarCenterY, 0.001]}
        pixelSize={1 / 800}
        width={frameSize.width}
        displayUrl={niceUrl.current?.href || page?.url || null}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onCopyUrl={handleCopyUrl}
        onNewTab={handleNewTab}
        onClose={handleClose}
        isSecure={isSecure}
      />
      {/* iframe only — resized to frameSize.height, shifted below the nav bar */}
      <Html
        transform
        distanceFactor={0.5}
        occlude="blending"
        scale={1}
        position={[0, iframeCenterY, 0]}
        style={{
          width: `${frameSize.width}px`,
          height: `${frameSize.height}px`,
        }}
        className="web-frame"
        geometry={
          <roundedPlaneGeometry
            args={[frameSize.width / 800, frameSize.height / 800, 0.02]}
          />
        }
      >
        <div
          style={{
            position: "relative",
            width: frameSize.width,
            height: frameSize.height,
          }}
        >
          {localShowSplash && (
            <div
              className="splash-screen"
              ref={splashScreenRef}
              style={{ width: frameSize.width, height: frameSize.height }}
            >
              {manifest?.icons && manifest.icons.length > 0 && (
                <picture>
                  {manifest.icons.map((icon) => (
                    <source key={icon.src} srcSet={icon.src} type={icon.type} />
                  ))}
                  <img
                    src={manifest.icons[0].src}
                    alt={`App Icon for ${manifest?.name || "App"}`}
                  />
                </picture>
              )}
              <h2>{manifest?.name || "Loading..."}</h2>
              <Progress value={progress} className="w-[60%]" />
            </div>
          )}
          <iframe
            id={id.toString()}
            ref={iframeRef}
            src={page?.url}
            title="Site Web"
          />
        </div>
      </Html>
    </group>
  );
}
