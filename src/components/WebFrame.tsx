import { Html } from "@react-three/drei";
import { Container, Text } from "@react-three/uikit";
import { Button } from "@react-three/uikit-default";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  House,
  RefreshCcw,
  X,
} from "@react-three/uikit-lucide";
import { truncate } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { usePagesStore } from "../store/pages.store";
import { usePWAStore } from "../store/pwa.store";
import { UnProxyFyUrl } from "../utils/proxy.utils";
import "./RoundedPlaneGeometry";
import { Progress } from "./ui/progress";

const DEFAULT_FRAME_SIZE = {
  width: 1280,
  height: 720,
};

interface FrameSize {
  width: number;
  height: number;
}

interface WebFrameProps {
  id: number;
  position?: [number, number, number];
}

export function WebFrame({ id, position = [5, 0, 0] }: WebFrameProps) {
  const [page, progressData] = usePagesStore(
    useShallow((state) => {
      const p = state.getPage(id);
      return [p, p?.progressData || null];
    })
  );
  const [progress, setProgress] = useState<number>(0);

  const manifest = usePWAStore((state) => state.manifest);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const splashScreenRef = useRef<HTMLDivElement>(null);
  const [showSplash, setShowSplash] = useState(true);
  const niceUrl = useRef(UnProxyFyUrl(page?.url || ""));

  // Calcule les dimensions finales en utilisant les valeurs par défaut si nécessaire
  const [frameSize, setFrameSize] = useState<FrameSize>(DEFAULT_FRAME_SIZE);

  // Gestion du flou quand l'on tourne la scene
  useEffect(() => {
    const handleMouseDown = () => {
      if (iframeRef.current) {
        iframeRef.current.classList.add("blurred");
      }
    };

    const handleMouseUp = () => {
      if (iframeRef.current) {
        iframeRef.current.classList.remove("blurred");
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Associer le listener de la page à l'iframe
  useEffect(() => {
    page?.pageListener.setIframe(iframeRef);
    niceUrl.current = UnProxyFyUrl(page?.url || "");
    console.log(
      "WebFrame: URL mise à jour pour la page",
      id,
      ":",
      niceUrl.current
    );
  }, [page, id]);

  // Gérer le manifest pour définir la taille du cadre
  useEffect(() => {
    if (
      manifest &&
      manifest.xr_main_scene &&
      manifest.xr_main_scene.default_size
    ) {
      setFrameSize(manifest.xr_main_scene.default_size);
    }
  }, [manifest]);

  // Gérer l'affichage de l'écran de démarrage
  useEffect(() => {
    let timer = null;
    if (!page?.showSplash && showSplash) {
      splashScreenRef.current?.classList.add("hidden");
      timer = setTimeout(() => {
        setShowSplash(false);
      }, 1000);
    }
    return () => (timer ? clearTimeout(timer) : undefined);
  }, [page?.showSplash, showSplash]);

  // Gérer la progression du chargement
  useEffect(() => {
    if (progressData) {
      setProgress(progressData.progress);
    }
  }, [progressData]);

  console.log(`Rendering WebFrame for page ID: ${id}`, progressData);
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      <group position={[0, 0.08 + frameSize.height / 800 / 2, 0]}>
        <Container
          width={frameSize.width / 10}
          height={8}
          backgroundColor={manifest?.background_color || "#ffffff"}
          borderRadius={5}
          flexDirection={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
          paddingX={1}
          transformScale={0.8}
        >
          <Button
            size="icon"
            height={6}
            width={6}
            borderRadius={3}
            backgroundColor={manifest?.theme_color || "#878995"}
          >
            <ChevronLeft width={4} height={4} />
          </Button>
          <Button
            size="icon"
            height={6}
            width={6}
            borderRadius={3}
            backgroundColor={manifest?.theme_color || "#878995"}
          >
            <ChevronRight width={4} height={4} />
          </Button>
          <Container
            height={6}
            width={frameSize.width / 10 - 35}
            borderRadius={3}
            flexDirection={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
            paddingX={1}
            backgroundColor={manifest?.theme_color || "#878995"}
          >
            <Text fontSize={3} marginLeft={1} color="white">
              {
                /**
                 * frameSize.width / 10 = Whole parent
                 * - 35 = remove all external buttons
                 * - 7 = button size
                 * - 3 = to align with radius
                 * console.log(frameSize.width / 11.5 - 35 - 7 - 3); // ideal text lenght computation
                 * simplified : frameSize.width / 11.5 - 45
                 */
                truncate(niceUrl.current.href, {
                  length: frameSize.width / 11.4 - 45,
                }) || "Loading..."
              }
            </Text>
            <Button
              size="icon"
              height={5}
              width={5}
              borderRadius={2.5}
              backgroundColor={manifest?.theme_color || "#878995"}
            >
              <RefreshCcw width={2} height={2} />
            </Button>
          </Container>
          <Button
            size="icon"
            height={6}
            width={6}
            borderRadius={3}
            backgroundColor={manifest?.theme_color || "#878995"}
          >
            <Copy width={3} height={3} />
          </Button>
          <Button
            size="icon"
            height={6}
            width={6}
            borderRadius={3}
            backgroundColor={manifest?.theme_color || "#878995"}
          >
            <House width={3} height={3} />
          </Button>
          <Button
            size="icon"
            height={6}
            width={6}
            borderRadius={3}
            backgroundColor={manifest?.theme_color || "#878995"}
          >
            <X width={3} height={3} />
          </Button>
        </Container>
      </group>
      <Html
        transform
        distanceFactor={0.5}
        occlude="blending"
        scale={1}
        style={{
          width: `${frameSize.width}px`,
          height: `${frameSize.height}px`,
        }}
        className="web-frame"
        geometry={
          <roundedPlaneGeometry
            args={[frameSize.width / 800, frameSize.height / 800, 0.02]}
          />
        }
      >
        {true && ( //showSplash
          <div
            className="splash-screen"
            ref={splashScreenRef}
            style={{ width: frameSize.width, height: frameSize.height }}
          >
            {manifest?.icons && manifest.icons.length > 0 && (
              <picture>
                {manifest?.icons &&
                  manifest.icons.map((icon) => (
                    <source key={icon.src} srcSet={icon.src} type={icon.type} />
                  ))}
                <img
                  src={
                    manifest?.icons && manifest.icons.length > 0
                      ? manifest.icons[0].src
                      : ""
                  }
                  alt={`App Icon for ${manifest?.name || "App"}`}
                />
              </picture>
            )}
            <h2>{manifest?.name || "Loading..."}</h2>
            <Progress value={progress} className="w-[60%]" />
          </div>
        )}
        <iframe
          id={id.toString()}
          ref={iframeRef}
          src={page?.url}
          title="Site Web"
        />
      </Html>
    </group>
  );
}
