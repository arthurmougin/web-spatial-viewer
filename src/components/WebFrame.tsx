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
      if (containerRef.current) {
        containerRef.current.style.pointerEvents = "none";
        containerRef.current.style.opacity = "0.6";
      }
    };

    const handleMouseUp = () => {
      if (containerRef.current) {
        containerRef.current.style.pointerEvents = "auto";
        containerRef.current.style.opacity = "1";
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
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "INIT_RESPONSE") {
        console.log("Frame connecté au viewer:", event.data);
      }
      console.log("Message reçu de la frame:", event.data);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const sendToFrame = (type: string, data: unknown) => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type, data }, "*");
    }
  };

  useEffect(() => {
    const onLoad = () => {
      sendToFrame("INIT", { hello: "viewer" });
    };
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", onLoad);
    }
    return () => {
      if (iframe) {
        iframe.removeEventListener("load", onLoad);
      }
    };
  }, [src]);

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
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#fff",
          boxShadow: "0 0 20px rgba(0,0,0,0.3)",
          overflow: "hidden",
          transition: "opacity 0.15s ease-out",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <iframe
            ref={iframeRef}
            src={src}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title="Site Web"
          />
        </div>
      </div>
    </Html>
  );
}
