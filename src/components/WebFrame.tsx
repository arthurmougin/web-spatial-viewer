import { Html } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { usePagesStore } from "../store/pages.store";
import { usePWAStore } from "../store/pwa.store";
import "./RoundedPlaneGeometry";

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
  const splashScreenRef = useRef<HTMLDivElement>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Calcule les dimensions finales en utilisant les valeurs par défaut si nécessaire
  const [frameSize, setFrameSize] = useState<FrameSize>(DEFAULT_FRAME_SIZE);

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
    page?.pageListener.setIframe(iframeRef);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [page]);

  useEffect(() => {
    if (
      manifest &&
      manifest.xr_main_scene &&
      manifest.xr_main_scene.default_size
    ) {
      setFrameSize(manifest.xr_main_scene.default_size);
    }
  }, [manifest]);

  useEffect(() => {
    let timer = null;
    if (!page?.showSplash && showSplash) {
      splashScreenRef.current?.classList.add("hidden");
      timer = setTimeout(() => {
        setShowSplash(false);
      }, 1000);
    }
    return () => (timer ? clearTimeout(timer) : undefined);
  }, [page?.showSplash, showSplash]);

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
        className="web-frame"
        geometry={
          <roundedPlaneGeometry
            args={[frameSize.width / 800, frameSize.height / 800, 0.02]}
          />
        }
      >
        {showSplash && ( //page?.showSplash ||
          <div
            className="splash-screen"
            ref={splashScreenRef}
            style={{ width: frameSize.width, height: frameSize.height }}
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
                />
              </picture>
            )}
            <h2>{manifest?.name || "Loading..."}</h2>
          </div>
        )}
        <iframe
          id={id.toString()}
          ref={iframeRef}
          src={page?.url.toString()}
          title="Site Web"
        />
      </Html>
    </group>
  );
}
