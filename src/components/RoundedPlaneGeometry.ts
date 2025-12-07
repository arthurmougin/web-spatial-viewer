import { extend } from "@react-three/fiber";
import { RoundedPlaneGeometry } from "maath/geometry";

extend({ RoundedPlaneGeometry });

declare module "@react-three/fiber" {
  interface ThreeElements {
    // @ts-expect-error -- we are extending the three elements with our custom geometry
    roundedPlaneGeometry: Object3DNode<
      RoundedPlaneGeometry,
      typeof RoundedPlaneGeometry
    >;
  }
}
