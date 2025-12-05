
interface WebManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

interface WebManifest {
  name: string;
  display: "minimal-ui" | "standalone" | "fullscreen" | "tabbed" | "browser";
  start_url: string;
  scope?: string;
  xr_main_scene?: {
    default_size?: {
      width: number;
      height: number;
    };
  };
  icons: WebManifestIcon[];
}