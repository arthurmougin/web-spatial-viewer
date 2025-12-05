import { BridgeReceiver } from "./classes/bridge-receiver";
import { Scene3D } from "./components/Scene3D";
import { SearchBar } from "./components/SearchBar";
import { usePWAStore } from "./store/pwa.store";

function App() {
  const loadURL = usePWAStore((state) => state.loadURL);
  BridgeReceiver.getInstance();
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <SearchBar onSubmit={loadURL} />
      <Scene3D />
    </div>
  );
}

export default App;
