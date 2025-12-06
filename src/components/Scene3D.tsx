import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { usePagesStore } from "../store/pages.store";
import Environment from "./Environment";
import { WebFrame } from "./WebFrame";

export function Scene3D() {
  const pages = usePagesStore((state) => state.pages);
  return (
    <Canvas camera={{ position: [0, 0, -0.8] }}>
      {pages &&
        pages.map((page) => (
          <WebFrame key={page.id} id={page.id} position={[0, 0, 0]} />
        ))}
      <OrbitControls makeDefault />
      <Environment showWelcome={false} />
    </Canvas>
  );
}
