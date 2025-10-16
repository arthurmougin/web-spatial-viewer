import { useEffect, useRef } from "react";
import { Html } from "@react-three/drei";

interface WebFrameProps {
  src: string;
  position?: [number, number, number];
}

export function WebFrame({ src, position = [5, 0, 0] }: WebFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  return (
    <Html
      transform
      position={position}
      rotation={[0, Math.PI, 0]}
      distanceFactor={0.5}
      occlude="blending"
      scale={1}
      style={{ width: "1280px", height: "720px" }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#fff",
          borderRadius: "10px",
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
