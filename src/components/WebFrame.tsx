import { useEffect, useRef } from "react";
import { Html } from "@react-three/drei";

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
  defaultSize?: FrameSize;
}

export function WebFrame({
  src,
  position = [5, 0, 0],
  defaultSize,
}: WebFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcule les dimensions finales en utilisant les valeurs par défaut si nécessaire
  const frameSize: FrameSize = defaultSize || DEFAULT_FRAME_SIZE;

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


  const htmlScale = 0.001; // Facteur d'échelle pour convertir les pixels en unités Three.js
  const scaledWidth = frameSize.width * htmlScale;
  const scaledHeight = frameSize.height * htmlScale;

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
