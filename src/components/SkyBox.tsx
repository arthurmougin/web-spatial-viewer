import { BackSide } from "three";
import { LayerMaterial, Depth, Noise, Fresnel } from "lamina";
import { Text3D, Center } from "@react-three/drei";

interface Direction {
  position: [number, number, number];
  rotation: [number, number, number];
  title: string;
  subtitle: string;
}

export default function SkyBox({ name = "Web Spatial Viewer" }) {
  const directions: Direction[] = [
    {
      position: [0, 0, 45],
      rotation: [0, Math.PI, 0],
      title: name,
      subtitle: "Forward",
    },
    {
      position: [0, 0, -45],
      rotation: [0, 0, 0],
      title: name,
      subtitle: "Back",
    },
    {
      position: [45, 0, 0],
      rotation: [0, -Math.PI / 2, 0],
      title: name,
      subtitle: "Right",
    },
    {
      position: [-45, 0, 0],
      rotation: [0, Math.PI / 2, 0],
      title: name,
      subtitle: "Left",
    },
    {
      position: [0, 45, 0],
      rotation: [-Math.PI / 2, Math.PI, 0], // Rotation -90° autour de X pour être parallèle au sol
      title: name,
      subtitle: "Up",
    },
    {
      position: [0, -45, 0],
      rotation: [Math.PI / 2, Math.PI, 0], // Rotation 90° autour de X pour être parallèle au sol
      title: name,
      subtitle: "Down",
    },
  ];

  return (
    <>
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

      {directions.map((dir, index) => (
        <group key={index} position={dir.position} rotation={dir.rotation}>
          <Center>
            <group position={[0, 5, 0]}>
              <Text3D
                size={3.75}
                height={0.5}
                curveSegments={12}
                bevelEnabled
                bevelThickness={0.1}
                bevelSize={0.1}
                bevelSegments={5}
                font="/fonts/helvetiker_regular.typeface.json"
              >
                {dir.title}
                <meshBasicMaterial color={"white"} />
              </Text3D>
            </group>
            <group position={[0, 0, 0]}>
              <Text3D
                size={2.5}
                height={0.5}
                curveSegments={8}
                bevelEnabled
                bevelThickness={0.05}
                bevelSize={0.05}
                bevelSegments={3}
                font="/fonts/helvetiker_regular.typeface.json"
              >
                {dir.subtitle}
                <meshStandardMaterial color={"white"} />
              </Text3D>
            </group>
          </Center>
        </group>
      ))}
    </>
  );
}
