import { Scene3D } from "./components/Scene3D";
import { SearchBar } from "./components/SearchBar";
import { usePagesStore } from "./store/pages.store";

function App() {
  const handlePageSubmission = usePagesStore(
    (state) => state.handlePageSubmission
  );
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <SearchBar onSubmit={handlePageSubmission} />
      <Scene3D />
    </div>
  );
}

export default App;
