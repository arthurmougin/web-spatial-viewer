import { BackSide } from "three";
import { LayerMaterial, Depth, Noise, Fresnel } from "lamina";
import { Text3D, Center } from "@react-three/drei";

interface SkyBoxProps {
  showWelcome?: boolean;
}

const Welcome = () => (
  <Center position={[0, 0, 0]} rotation={[0, Math.PI, 0]} scale={0.8}>
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

export default function Environment({ showWelcome = false }: SkyBoxProps) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight color="white" position={[0, 1, -1]} intensity={1} />
      <pointLight position={[2, 2, 2]} intensity={1} />
      <mesh scale={[100, 100, 100]}>
        <sphereGeometry args={[1, 64, 64]} />
        <LayerMaterial side={BackSide}>
          <Fresnel
            color="#1e293b"
            alpha={1}
            mode="normal"
            intensity={0.3}
            power={2}
          />
          <Depth
            colorA="#00ffff"
            colorB="#ff8f00"
            alpha={0.5}
            mode="normal"
            near={0}
            far={300}
            origin={[100, 100, 100]}
          />
          <Noise mapping="local" type="cell" scale={0.5} mode="softlight" />
        </LayerMaterial>
      </mesh>
      {showWelcome && <Welcome />}
    </>
  );
}
