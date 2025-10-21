interface FrameProps {
  src: string;
  isLoading: boolean;
  error: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  style?: React.CSSProperties;
  onLoad?: () => void;
}

export function Frame({
  src,
  isLoading,
  error,
  iframeRef,
  style,
  onLoad,
}: FrameProps) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <iframe
        ref={iframeRef}
        src={src}
        onLoad={onLoad}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          opacity: isLoading ? 0.6 : 1,
          transition: "opacity 0.3s ease",
          ...style,
        }}
        title="Site Web"
      />
      {error && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "8px",
            background: "#ff5555",
            color: "white",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
