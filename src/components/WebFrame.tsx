import { useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
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
  src: string;
  position?: [number, number, number];
}

export function WebFrame({
  src,
  position = [5, 0, 0],
}: WebFrameProps) {
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

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if(manifest && manifest.xr_main_scene && manifest.xr_main_scene.default_size) {
      setFrameSize(manifest.xr_main_scene.default_size);
    }

  }, [manifest]);

  return (
    <Html
      transform
      position={position}
      rotation={[0, Math.PI, 0]}
      distanceFactor={0.5}
      occlude="blending"
      scale={1}
      style={{
        width: `${frameSize.width}px`,
        height: `${frameSize.height}px`,
      }}
    >
      <iframe
        ref={iframeRef}
        src={src}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          transition: "filter 0.3s ease",
        }}
        title="Site Web"
      />
    </Html>
  );
}
