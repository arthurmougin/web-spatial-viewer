import { BackSide } from "three";
import { Text3D, Center } from "@react-three/drei";

interface SkyBoxProps {
  showWelcome?: boolean;
}

const Welcome = () => (
  <Center position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
    <Text3D
      font="/fonts/helvetiker_regular.typeface.json"
      size={0.15}
      height={0.01}
      curveSegments={12}
      bevelEnabled
      bevelThickness={0.002}
      bevelSize={0.002}
      bevelOffset={0}
      bevelSegments={3}
    >
      Web Spatial Viewer
      <meshStandardMaterial color="#299bf8" metalness={0.5} roughness={0.5} />
    </Text3D>
    <Text3D
      position={[0.1, -0.2, 0]}
      font="/fonts/helvetiker_regular.typeface.json"
      size={0.05}
      height={0.005}
      curveSegments={2}
    >
      By Arthur Mougin
      <meshPhysicalMaterial
        color="#4d4fc9"
        opacity={0.2}
        transparent
        wireframe
      />
    </Text3D>
  </Center>
);

export default function SkyBox({ showWelcome = false }: SkyBoxProps) {
  return (
    <>
      <mesh scale={[100, 100, 100]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          side={BackSide}
          color="#1e293b"
          metalness={0.2}
          roughness={0.8}
          envMapIntensity={0.5}
        />
      </mesh>
      {showWelcome && <Welcome />}
    </>
  );
}
