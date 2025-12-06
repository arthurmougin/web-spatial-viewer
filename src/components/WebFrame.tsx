import { Html } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { defaultWebManifest } from "../../types/pwa";
import { usePagesStore } from "../store/pages.store";
import { usePWAStore } from "../store/pwa.store";

const DEFAULT_FRAME_SIZE = {
  width: 1280,
  height: 720,
};

interface FrameSize {
  width: number;
  height: number;
}

interface WebFrameProps {
  id: number;
  position?: [number, number, number];
}

export function WebFrame({ id, position = [5, 0, 0] }: WebFrameProps) {
  const page = usePagesStore((state) => state.getPage(id));
  const manifest = usePWAStore((state) => state.manifest);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Calcule les dimensions finales en utilisant les valeurs par défaut si nécessaire
  const [frameSize, setFrameSize] = useState<FrameSize>(DEFAULT_FRAME_SIZE);

  useEffect(() => {
    const handleMouseDown = () => {
      if (iframeRef.current) {
        iframeRef.current.style.pointerEvents = "none";
        iframeRef.current.style.filter = "blur(2px)";
      }
    };

    const handleMouseUp = () => {
      if (iframeRef.current) {
        iframeRef.current.style.pointerEvents = "auto";
        iframeRef.current.style.filter = "none";
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    page?.pageListener.setIframe(iframeRef);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (
      manifest &&
      manifest.xr_main_scene &&
      manifest.xr_main_scene.default_size
    ) {
      setFrameSize(manifest.xr_main_scene.default_size);
    }
  }, [manifest]);

  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      <Html
        transform
        distanceFactor={0.5}
        occlude="blending"
        scale={1}
        style={{
          width: `${frameSize.width}px`,
          height: `${frameSize.height}px`,
        }}
      >
        {true && ( //page?.showSplash ||
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor:
                manifest?.background_color ||
                defaultWebManifest.background_color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
              color: manifest?.theme_color || defaultWebManifest.theme_color,
            }}
          >
            {manifest?.icons && manifest.icons.length > 0 && (
              <picture>
                {manifest?.icons && manifest.icons.length > 0 && (
                  <source
                    srcSet={manifest.icons[0].src}
                    type={manifest.icons[0].type}
                  />
                )}
                <img
                  src={
                    manifest?.icons && manifest.icons.length > 0
                      ? manifest.icons[0].src
                      : ""
                  }
                  alt={`App Icon for ${manifest?.name || "App"}`}
                  style={{ width: 64, height: 64, marginRight: 16 }}
                />
              </picture>
            )}
            {manifest?.name || "Loading..."}
          </div>
        )}
        <iframe
          id={id.toString()}
          ref={iframeRef}
          src={page?.url.toString()}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            transition: "filter 0.3s ease",
          }}
          title="Site Web"
        />
      </Html>
    </group>
  );
}
