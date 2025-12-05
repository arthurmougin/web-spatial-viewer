import { OrbitControls } from "@react-three/drei";
import Environment from "./Environment";
import { Canvas } from "@react-three/fiber";
import { usePWAStore } from "../store/pwa.store";
import { WebFrame } from "./WebFrame";

export function Scene3D() {
  const pages = usePWAStore( (state) => state.pages ) ;
  return (
    <Canvas camera={{ position: [0, 0, -0.8] }}>
      {pages && pages.map((page, index) => (
        <WebFrame
          key={index}
          src={page.toString()}
          position={[0, 0, 0]}
        />
      ))}
      <OrbitControls makeDefault />
      <Environment showWelcome={false} />
    </Canvas>
  );
}
