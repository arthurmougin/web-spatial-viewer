import { useState } from "react";
import { Scene3D } from "./components/Scene3D";
import { SearchBar } from "./components/SearchBar";

function App() {
  const [iframeSrc, setIframeSrc] = useState<string | undefined>(undefined);
  const [showSearch, setShowSearch] = useState(true);

  const handleSubmit = (url: string) => {
    if (url) {
      try {
        const { hostname, pathname, search } = new URL(url);
        const subdomain = hostname.replace(/\./g, "-");
        const proxyPort = 3000;
        const proxyUrl = `http://${subdomain}.localhost:${proxyPort}${pathname}${search}`;
        setIframeSrc(proxyUrl);
        setShowSearch(false);
      } catch (error) {
        console.error("URL invalide:", error);
      }
    }
  };

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
      <Scene3D iframeSrc={iframeSrc} />
    </div>
  );
}

export default App;
