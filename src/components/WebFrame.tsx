import { Html } from "@react-three/drei";
import type { FrameSize } from "../types/spatial";
import { DEFAULT_FRAME_SIZE } from "../types/spatial";
import { useFrameCommunication } from "../hooks/useFrameCommunication";
import { Frame } from "./Frame";

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
  const { iframeRef, containerRef, isLoading, error, onIframeLoad } =
    useFrameCommunication(src);

  // Calcule les dimensions finales en utilisant les valeurs par défaut si nécessaire
  const frameSize: FrameSize = defaultSize || DEFAULT_FRAME_SIZE;

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
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#fff",
          boxShadow: "0 0 20px rgba(0,0,0,0.3)",
          overflow: "hidden",
          transition: "opacity 0.15s ease-out",
          position: "relative",
        }}
      >
        <Frame
          src={src}
          isLoading={isLoading}
          error={error}
          iframeRef={iframeRef}
          onLoad={onIframeLoad}
        />
      </div>
    </Html>
  );
}
