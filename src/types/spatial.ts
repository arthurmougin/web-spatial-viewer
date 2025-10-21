export interface FrameSize {
  width: number;
  height: number;
}

export const DEFAULT_FRAME_SIZE: FrameSize = {
  width: 1280,
  height: 720,
};

export interface WebManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

export interface WebManifest {
  name: string;
  display: "minimal-ui" | "standalone" | "fullscreen" | "tabbed" | "browser";
  start_url: string;
  scope?: string;
  xr_main_scene?: {
    default_size?: FrameSize;
  };
  icons: WebManifestIcon[];
}
