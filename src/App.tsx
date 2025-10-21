import { Scene3D } from "./components/Scene3D";
import { SearchBar } from "./components/SearchBar";
import { useWebManifest } from "./hooks/useWebManifest";

function App() {
  const { iframeSrc, showSearch, manifest, loadingIcon, handleSubmit } =
    useWebManifest();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {showSearch && <SearchBar onSubmit={handleSubmit} />}
      {loadingIcon && !iframeSrc && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 0 20px rgba(0,0,0,0.3)",
            textAlign: "center",
          }}
        >
          <img
            src={loadingIcon}
            alt={manifest?.name || "Loading"}
            style={{
              maxWidth: "128px",
              maxHeight: "128px",
              display: "block",
              margin: "0 auto",
            }}
          />
          {manifest?.name && (
            <div style={{ marginTop: "10px", fontWeight: "bold" }}>
              {manifest.name}
            </div>
          )}
        </div>
      )}
      <Scene3D
        iframeSrc={iframeSrc}
        defaultSize={manifest?.xr_main_scene?.default_size}
      />
    </div>
  );
}

export default App;
