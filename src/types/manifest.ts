export interface Manifest {
  name: string;
  short_name?: string;
  description?: string;
  start_url: string;
  scope?: string;
  display?: "fullscreen" | "standalone" | "minimal-ui" | "browser";
  orientation?: "any" | "natural" | "landscape" | "portrait";
  theme_color?: string;
  background_color?: string;
  icons?: Array<{
    src: string;
    sizes: string;
    type?: string;
    purpose?: string;
  }>;
}
