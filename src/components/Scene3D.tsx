import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SkyBox from "./SkyBox";
import { WebFrame } from "./WebFrame";

interface Scene3DProps {
  iframeSrc?: string;
}

export function Scene3D({ iframeSrc }: Scene3DProps) {
  return (
    <Canvas camera={{ position: [0, 0, -0.8] }}>
      <ambientLight intensity={0.8} />
      <directionalLight color="white" position={[0, 1, -1]} intensity={1} />
      <pointLight position={[2, 2, 2]} intensity={1} />
      {iframeSrc && <WebFrame src={iframeSrc} position={[0, 0, 0]} />}
      <OrbitControls makeDefault />
      <SkyBox />
    </Canvas>
  );
}
