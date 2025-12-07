import type { MIMEType } from "util";

interface WebManifestIcon {
  src: string;
  //width and height in pixels in the format "WxH", e.g. "48x48"
  sizes?: string;
  type?: MIMEType;
  /**
   * string containing "monochrome", "maskable", or "any" or any combination of those separated by spaces
   * monochrome: Indicates that the icon is intended to be used as a monochrome icon with a solid fill. With this value, a browser discards the color information in the icon and uses only the alpha channel as a mask over any solid fill
   * maskable: Indicates that the icon is designed with icon masks and safe zone in mind, such that any part of the image outside the safe zone can be ignored and masked away
   * any: Indicates that the icon is intended to be used without any special treatment
   * see https://developer.mozilla.org/en-US/docs/Web/Manifest/icons#purpose
   */
  purpose?: string;
}

interface WebManifestScreenshot {
  src: string;
  sizes?: string;
  type?: string;
  platform?:
    | "wide"
    | "narrow"
    | "android"
    | "chromeos"
    | "ios"
    | "kaios"
    | "macos"
    | "windows"
    | "xbox"
    | "chrome_web_store"
    | "play"
    | "itunes"
    | "microsoft_store";
  label?: string;
}

interface Shortcut {
  name: string;
  short_name?: string;
  description?: string;
  url: string;
  icons?: WebManifestIcon[];
}

enum category {
  books = "books",
  business = "business",
  education = "education",
  entertainment = "entertainment",
  finance = "finance",
  fitness = "fitness",
  food = "food",
  games = "games",
  government = "government",
  health = "health",
  kids = "kids",
  lifestyle = "lifestyle",
  magazines = "magazines",
  medical = "medical",
  music = "music",
  navigation = "navigation",
  news = "news",
  personalization = "personalization",
  photo = "photo",
  politics = "politics",
  productivity = "productivity",
  security = "security",
  shopping = "shopping",
  social = "social",
  sports = "sports",
  travel = "travel",
  utilities = "utilities",
  weather = "weather",
}
/**
 * Display mode of the web application
 * fullscreen: The application takes up the entire screen, with no browser UI visible.
 * standalone: The application looks and feels like a standalone app. The browser UI is hidden, but the status bar may still be visible.
 * minimal-ui: The application has a minimal set of browser UI elements, such as back, refresh, forward buttons and an address bar.
 * browser: The application is displayed in a standard browser tab or window, with all browser UI elements visible.
 * fallback order is: fullscreen > standalone > minimal-ui > browser
 */
type DisplayMode = "fullscreen" | "standalone" | "minimal-ui" | "browser";

interface WebManifest {
  // background for the UI and splash screen
  background_color?: string;
  categories?: category[];
  // meant for app store listing
  description?: string;
  display: DisplayMode;
  icons?: WebManifestIcon[];
  // unique identifier for the web app, take the form of an url, fallback to start_url if not provided
  id?: string;
  // Full name of the web app
  name: string;
  // Allowed orientation for the web app
  orientation?:
    | "any" // No preferred orientation
    | "natural" // Device main orientation
    | "landscape" // width greater than height
    | "portrait" // height greater than width
    | "portrait-primary" // default portrait orientation
    | "portrait-secondary" // same as portrait-primary but upside down
    | "landscape-primary" // default landscape orientation
    | "landscape-secondary"; // same as landscape-primary but upside down
  // Either absolute, relative, or limited to a specific folder define wich url are within the scope of the PWA
  scope?: string;
  // Preview for app store
  screenshots?: WebManifestScreenshot[];
  //Fallback name when name is too long
  short_name?: string;
  // Context menu for web app icon
  shortcuts?: Shortcut[];
  // Hint to be interpreted as we please
  start_url: string;
  // Default theme color for the OS
  theme_color?: string;
  xr_main_scene?: {
    default_size?: {
      width: number;
      height: number;
    };
  };
}

export const defaultWebManifest: WebManifest = {
  name: "I aM aN IdIoT wHo FoRgOt To SeT a NaMe In ThE WeB MaNiFeSt",
  display: "minimal-ui",
  background_color: "#ffffffff",
  theme_color: "#c0cdd0ff",
  start_url: "https://google.com",
};
