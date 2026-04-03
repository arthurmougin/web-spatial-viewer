# Architecture — web-spatial-viewer

> Last updated: 2026-03-26

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Developer's Browser (e.g. Chrome / Firefox on Windows)         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Viewer (port 47892 — Vite dev server)                     │  │
│  │  React + React Three Fiber                                │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Three.js Canvas                                    │  │  │
│  │  │                                                     │  │  │
│  │  │  ┌──────────────┐   ┌──────────────────────────┐    │  │  │
│  │  │  │  Environment │   │  WebFrame (per page)     │    │  │  │
│  │  │  │  (skybox)    │   │                          │    │  │  │
│  │  │  └──────────────┘   │  [3D nav chrome]         │    │  │  │
│  │  │                     │  [drei <Html> component] │    │  │  │
│  │  │                     │    ├─ splash screen      │    │  │  │
│  │  │                     │    └─ <iframe>           │    │  │  │
│  │  │                     └──────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  SearchBar (HTML overlay on canvas)                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                │  iframe src=http://[proxied].localhost:47891    │
│                ▼                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  <iframe> — proxified page                                 │ │
│  │                                                            │ │
│  │  Contains injected: spatial-viewer-bridge.js               │ │
│  │  Bridge posts messages to window.top (the viewer)          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                │
                │  HTTP fetch (node-fetch)
                ▼
┌───────────────────────────────────────────────────────────────┐
│  Proxy server (port 47891 — Node/Express, tsx)                 │
│  server/server.ts                                             │
│                                                               │
│  Route: GET *path (Accept: text/html)                         │
│    1. Resolve target URL from subdomain                       │
│    2. Fetch HTML from actual origin                           │
│    3. Inject bridge <script> before </head>                   │
│    4. Rewrite all https:// URLs in HTML to proxified form     │
│    5. Serve modified HTML                                     │
│                                                               │
│  Route: GET *path (other)                                     │
│    Proxy resource as-is (CSS, JS, images, fonts)              │
│                                                               │
│  Route: GET /events/:pageId                                   │
│    SSE progress stream (HTML_START → HTML_COMPLETE)           │
│                                                               │
│  Route: GET /lib/spatial-viewer-bridge.js                     │
│    Serves the built bridge script from dist/lib/              │
└───────────────────────────────────────────────────────────────┘
                │
                │  Internet (node-fetch)
                ▼
        Target website origin
```

---

## URL Proxification

The proxy uses subdomain encoding so the browser treats each proxified origin as a distinct same-origin scope:

| Real URL                              | Proxified URL                                        |
| ------------------------------------- | ---------------------------------------------------- |
| `https://lofi.cafe/`                  | `http://lofi-cafe.localhost:47891/`                   |
| `https://lofi.jingle.avp.vercel.app/` | `http://lofi-jingle-avp--vercel-app.localhost:47891/` |

**Rule:**

- Last two domain parts → joined with `-` (the "main domain")
- Remaining subdomain parts → joined with `-` (the "site name")
- Combined: `<site-name>--<main-domain>.localhost:47891`

This logic lives in two places (currently duplicated):

- `server/server.ts`: `proxyFyUrl()` and `getTargetUrlFromHost()`
- `src/utils/proxy.utils.ts`: `proxyFyUrl()` and `UnProxyFyUrl()`

---

## Message Protocol (Viewer ↔ Bridge)

```
Bridge (iframe)                      Viewer (window.top)
      │                                     │
      │── INIT ──────────────────────────►  │  (sends manifest URL, SDK signature)
      │                                     │
      │  ◄── ID_ATTRIBUTION ──────────────  │  (assigns numeric page id)
      │                                     │
      │── NETWORK_IDLE ──────────────────►  │  (page window.load complete → hide splash)
      │                                     │
      │  (future: NAVIGATE, LOG, ERROR)     │
```

All messages go through `window.top.postMessage(data, "*")` from the bridge, and via `iframe.contentWindow.postMessage(data, "*")` from the viewer.

**Message types** (`types/bridge.d.ts`):

| Type             | Direction           | Purpose                                                           |
| ---------------- | ------------------- | ----------------------------------------------------------------- |
| `INIT`           | Bridge → Viewer     | Initial handshake; carries manifest URL + WebSpatial SDK presence |
| `ID_ATTRIBUTION` | Viewer → Bridge     | Assigns the numeric page ID                                       |
| `NETWORK_IDLE`   | Bridge → Viewer     | `window.load` has fired → dismiss splash screen                   |
| `ERROR`          | (defined, not used) | Error forwarding — not yet implemented                            |

> `IBridgeMessage.id` is typed as `number` in `types/bridge.d.ts`. The bridge class internally holds `private id: number | null` — this field receives the id from `ID_ATTRIBUTION.data.id`.

---

## SSE Progress Channel

In parallel with the postMessage bridge, the proxy pushes loading progress via Server-Sent Events. The viewer subscribes at page creation time:

```
Viewer ──► GET http://localhost:47891/events/:pageId  (SSE)
                │
  Proxy sends:  HTML_START (0%)
                HTML_FETCHING (25%)
                HTML_FETCHED (50%)
                HTML_PROCESSING (75%)
                HTML_COMPLETE (100%)
                RESOURCE_* events
```

This drives the `<Progress>` bar in the splash screen.

---

## State Management

Two Zustand stores:

### `pages.store.ts`

```
pages: Page[]
  ├── id: number (Date.now())
  ├── url: string (proxified URL)
  ├── pageListener: PageListener (handles postMessage from this iframe)
  ├── progressListener: ProgressListener (handles SSE from proxy)
  ├── progressData: ProgressData | null
  └── showSplash: boolean
```

### `pwa.store.ts`

```
manifest: WebManifest | null        (parsed from the page's manifest link)
webSpatialSDKSignature: WebSpatialSDKSignature | null
```

---

## Build System

| Script         | Command                                          | Purpose                                                                                 |
| -------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `dev`          | `vite`                                           | Viewer dev server (HMR)                                                                 |
| `build`        | `tsc -b && vite build`                           | Production build of viewer + bridge (outputs `dist/lib/spatial-viewer-bridge.js`)       |
| `server:watch` | `npx tsx --watch server/server.ts`               | Proxy server with hot reload                                                            |
| `lib:watch`    | `vite build --watch --config vite.lib.config.ts` | **Partially broken** — config is correct but outputs wrong filename (`.es.js` vs `.js`) |
| `lint`         | `eslint .`                                       | Linting                                                                                 |
| `preview`      | `vite preview`                                   | Preview production build                                                                |

The bridge script is built as part of `vite.config.ts` (entry `spatial-viewer-bridge`) and output to `dist/lib/spatial-viewer-bridge.js`. `vite.lib.config.ts` exists as a bridge-only watch config but produces a differently named output — it needs the `entryFileNames` to be fixed before `lib:watch` is usable.

---

## File Map

```
server/
  server.ts            Proxy server (Express)

src/
  main.tsx             React entry point
  App.tsx              Root component (SearchBar + Scene3D)
  App.css              Root styles
  index.css            Global styles + Tailwind + CSS custom properties

  components/
    Scene3D.tsx         Three.js canvas (Camera + OrbitControls + Environment + WebFrames)
    Environment.tsx     Procedural skybox (lamina)
    WebFrame.tsx        Main spatial browser window (3D chrome + iframe)
    NavBar3D.tsx         uikit-based 3D browser chrome (R3F / uikit) — primary implementation
    NavBar.tsx          Legacy HTML/CSS nav bar (inside drei Html) — NOT the intended architecture
    NavBar.module.css   CSS Modules for the legacy HTML nav bar — NOT the intended architecture
    SearchBar.tsx       Top-level URL input (HTML overlay on canvas)
    SearchBar.module.css
    RoundedPlaneGeometry.ts  Extends R3F with maath rounded plane geometry
    ui/
      progress.tsx      Radix UI progress bar (shadcn/ui generated)

  classes/
    page-listener.ts    Handles postMessage from a specific iframe
    progress-listener.ts  Handles SSE progress events from proxy

  store/
    pages.store.ts      Zustand store: page lifecycle
    pwa.store.ts        Zustand store: PWA manifest + WebSpatial detection

  lib/
    spatial-viewer-bridge.ts  Bridge injected into proxified pages
    utils.ts            Tailwind utility (cn function, shadcn/ui)

  utils/
    proxy.utils.ts      Client-side URL proxification + de-proxification
    pwa.utils.ts        Manifest fetching, icon resolution, scope check

types/
  bridge.d.ts           Bridge message types + WebSpatial SDK signature type
  pwa.d.ts              Web Manifest type + xr_main_scene extension

public/
  fonts/
    helvetiker_regular.typeface.json  3D font for the welcome text
```

---

## Technology Choices

| Concern         | Library                      | Notes                                                                                                                    |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 3D rendering    | Three.js + React Three Fiber | `@react-three/fiber`                                                                                                     |
| 3D helpers      | `@react-three/drei`          | OrbitControls, Html, Text3D, Center                                                                                      |
| 3D UI           | `@react-three/uikit`         | **Not used for nav chrome.** Packages still in dependencies but no active imports. Nav chrome uses HTML/CSS Modules.     |
| Skybox material | `lamina`                     |                                                                                                                          |
| State           | Zustand v5                   |                                                                                                                          |
| Proxy server    | Express v5 + node-fetch      |                                                                                                                          |
| SSE             | Native Express `res.write`   | No external library                                                                                                      |
| Build           | Vite 7                       |                                                                                                                          |
| Styling         | CSS Modules + Tailwind 4     | Both are used: NavBar/SearchBar use CSS Modules; `progress.tsx` uses Tailwind. New components should prefer CSS Modules. |
| Component lib   | shadcn/ui (Radix + CVA)      | Only `Progress` component added so far                                                                                   |
