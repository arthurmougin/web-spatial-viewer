# Current State — web-spatial-viewer

> Audit date: 2026-03-26  
> Auditor: GitHub Copilot code archaeology pass  
> Status: **Functioning prototype — incomplete browser chrome, no test suite**

---

## Purpose

`web-spatial-viewer` is a developer-focused emulator that approximates enough of the Safari / visionOS browsing experience to allow developers on Windows (or without an Apple Vision Pro headset) to:

- Load and inspect websites inside a spatial 3D shell
- Test PWA manifest parsing and splash screen behavior
- Experiment with WebSpatial-inspired features (SDK detection, `xr_main_scene` sizing)
- Observe how a page behaves inside a proxied iframe with an injected bridge script

**What it is not:**

- A full Safari clone
- A WebXR emulator
- A native visionOS simulator replacement
- A real-device testing substitute
- Compatible with WebSpatial SDK in any official sense

Feature classification used throughout: **Confirmed / Partial / Missing / Broken / Unknown**

---

## Run Instructions

### Prerequisites

- Node.js ≥ 20
- npm

### Development mode (both must run simultaneously)

**Terminal 1 — Proxy server:**

```bash
npm run server:watch
# Starts Express proxy at http://localhost:3000
```

**Terminal 2 — Front-end viewer:**

```bash
npm run dev
# Starts Vite dev server, typically at http://localhost:5173
```

**To load a site:**  
Open the viewer in a browser and type a URL (e.g. `https://lofi.cafe`) in the top search bar. The viewer proxifies the URL and loads it into the 3D iframe.

Or pass a URL via query string:  
`http://localhost:5173?url=https://lofi.cafe`

### Bridge library build (required for proxy injection)

```bash
# Full build (viewer + bridge)
npm run build

# Watch mode for bridge only
npm run lib:watch
# Uses vite.lib.config.ts — but currently outputs spatial-viewer-bridge.es.js
# Server expects spatial-viewer-bridge.js — see Known Issues #1
# Workaround: use 'npm run build' to produce the correct file
```

> **WARNING:** `dist/lib/spatial-viewer-bridge.js` must exist for the bridge to be injected. Run `npm run build` first if it is missing. `lib:watch` does not currently produce the correctly named file.

---

## Current Architecture

See [architecture.md](./architecture.md) for the full model.

Three main runtime layers:

| Layer             | Runtime               | Entry point                        |
| ----------------- | --------------------- | ---------------------------------- |
| Proxy server      | Node (tsx)            | `server/server.ts` → port 3000     |
| Front-end viewer  | Browser (Vite/React)  | `src/main.tsx` → port 5173         |
| Bridge (injected) | Browser (page iframe) | `src/lib/spatial-viewer-bridge.ts` |

---

## Confirmed Features

### Proxy (server/server.ts)

- **Confirmed** — Subdomain-based URL proxification. `https://foo.bar.com` → `http://foo--bar-com.localhost:3000`
- **Confirmed** — HTML fetch + bridge script injection (`<script src="/lib/spatial-viewer-bridge.js" type="module">`) into every proxified page's `<head>`
- **Confirmed** — In-HTML URL rewriting: all `https://` URLs in served HTML are proxified via regex replacement (fragile — regex only, not attribute-aware)
- **Confirmed** — Resource proxying (JS, CSS, images, fonts) via fallback route
- **Confirmed** — SSE (Server-Sent Events) progress channel at `/events/:pageId` — reports HTML fetch stages back to the viewer

### Viewer (src/)

- **Confirmed** — Three.js / React Three Fiber scene with OrbitControls
- **Confirmed** — Procedural skybox using `lamina` (Fresnel + Depth + Noise layers)
- **Confirmed** — 3D iframe embedding via `@react-three/drei` `<Html>` with custom `RoundedPlaneGeometry`
- **Confirmed** — Splash screen during page load (shows PWA icon + app name + progress bar)
- **Confirmed** — PWA manifest fetching and parsing (`manifest.webmanifest` link detection via bridge INIT message)
- **Confirmed** — `xr_main_scene.default_size` — custom non-standard manifest field used to size the iframe frame
- **Confirmed** — Browser chrome: uikit-based 3D nav bar `NavBar3D.tsx` renders inside the R3F scene using `@react-three/uikit`. `NavBar.tsx` + `NavBar.module.css` exist as a **legacy HTML/CSS experiment** rendered via drei `<Html>` — they are NOT the intended architecture and are candidates for removal.
- **Confirmed** — Reload, Close, Copy URL, New Tab buttons are **wired** in `WebFrame.tsx`
- **Partial** — URL display shows the **de-proxified** URL via `UnProxyFyUrl()`. Translucency approximated with uikit `opacity` per element (CSS `backdrop-filter` not available in WebGL).
- **Confirmed** — Zustand state stores: `pages.store.ts` (pages + page lifecycle), `pwa.store.ts` (manifest + WebSpatial signature)
- **Confirmed** — URL-in-query-string: viewer can be launched with `?url=...` to auto-load a page
- **Confirmed** — PostMessage bridge: viewer sends `ID_ATTRIBUTION` → bridge sends `INIT` + `NETWORK_IDLE`
- **Confirmed** — Splash screen dismissal on `NETWORK_IDLE` bridge message
- **Confirmed** — Blur effect on iframe while OrbitControls is active (mousedown/mouseup handlers)

### Bridge (src/lib/spatial-viewer-bridge.ts)

- **Confirmed** — Singleton instantiation via `window.SpatialViewerBridge`
- **Confirmed** — `INIT` message on page load: sends originHref, manifest link, WebSpatial SDK signature
- **Confirmed** — `NETWORK_IDLE` message on `window.load`
- **Confirmed** — ID handshake (backlog mechanism before ID is assigned)
- **Confirmed** — Detection of `window.__webspatialsdk__` signature (WebSpatial-inspired feature — project-specific approximation)

---

## Broken or Incomplete Areas

| #   | Item                                                             | Evidence                                                                                                                                          | Severity |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | `lib:watch` generates wrong output filename                      | `vite.lib.config.ts` outputs `spatial-viewer-bridge.es.js`; server expects `spatial-viewer-bridge.js`. Build succeeds but file is never served.   | Medium   |
| 2   | Bridge `private id: string \| null` should be `number \| null`   | `spatial-viewer-bridge.ts` stores a `number` received from `ID_ATTRIBUTION` into a `string \| null` field — type annotation wrong, runtime works. | Low      |
| 3   | Back / Forward buttons are stubs                                 | `WebFrame.tsx`: `onBack`/`onForward` have TODO comment — depend on unimplemented `NAVIGATE` bridge message                                        | High     |
| 4   | Bridge `pageLoadListening()` does nothing useful                 | `readystatechange`, `DOMContentLoaded`, `progress`, `stalled` events are just passed to `console.log` — no data forwarded to viewer               | Low      |
| 5   | No navigation message in bridge                                  | Clicking links inside the iframe changes the iframe URL but the viewer is never notified. No `NAVIGATE` message type exists.                      | High     |
| 6   | No console/error forwarding                                      | Page logs and errors are not relayed to the viewer                                                                                                | Medium   |
| 7   | CSP / X-Frame-Options headers not stripped                       | Server passes through `Content-Security-Policy` and `X-Frame-Options` headers — many modern sites block the iframe                                | High     |
| 8   | `chalk` used in server.ts but not declared in `package.json`     | Works transitively today, but fragile. Should be an explicit dependency.                                                                          | Low      |
| 9   | `@react-three/uikit` packages still in `package.json` but unused | No import of uikit in any src file. These are orphaned dependencies.                                                                              | Low      |
| 10  | SF Pro font not loaded                                           | `copilot-instructions.md` references it, CSS in `index.css` falls back to system UI sans-serif                                                    | Low      |

---

## Major Unknowns

- **Does proxified URL rewriting work for CSP-protected pages?** Server does not strip `Content-Security-Policy` or `X-Frame-Options` headers. Many modern sites will block the iframe entirely.
- **Does the bridge injection work for single-page apps loaded dynamically?** The script is injected once into the initial HTML — SPA navigations are not re-injected.
- **WebSpatial SDK signature detection**: unclear which real WebSpatial version this matches. Detection relies on `window.__webspatialsdk__`, which may not be set by all WebSpatial toolchains.
- **Multi-window**: `addPage` and `pages.store.ts` support multiple pages, but `App.tsx` calls `handleFirstPageSubmission` which resets all pages to one. Multi-window is not exposed in the UI.
- **History management**: no back/forward history is tracked. The bridge has no `NAVIGATE` message type.

---

## Glossary

| Term                | Definition                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **viewer**          | The React Three Fiber front-end app. Renders the 3D spatial shell and embeds the proxified page in an iframe inside a Three.js scene.                                                                                        |
| **bridge**          | A JavaScript module (`spatial-viewer-bridge.ts`) injected by the proxy into every served page. Communicates with the viewer via `postMessage`.                                                                               |
| **proxy**           | The Express server (`server.ts`) running on port 3000. Fetches remote pages, injects the bridge script, rewrites URLs, and streams resources.                                                                                |
| **spatial web**     | An informal term for web experiences designed for or optimized for spatial computing contexts (e.g. Apple Vision Pro). Not a single standard.                                                                                |
| **WebXR**           | A W3C browser API for immersive VR/AR experiences. Distinct from the visionOS spatial browsing layer. Safari on visionOS supports WebXR immersive sessions.                                                                  |
| **WebSpatial**      | A separate open-source project (https://webspatial.dev) that adds spatial concepts to web apps via an App Shell + SDK bridge. Not Apple's native SDK.                                                                        |
| **approximation**   | A feature that mimics the behavior or appearance of a native capability without access to the underlying platform API. Clearly distinguished from accurate emulation throughout this project.                                |
| **native behavior** | Behavior that exists in real Safari/visionOS and cannot be faithfully reproduced in a browser-only environment without platform access.                                                                                      |
| **xr_main_scene**   | A non-standard Web Manifest field introduced in this project. Carries spatial sizing hints (`default_size.width/height`) for the iframe frame. WebSpatial-inspired feature — project-specific, not part of any web standard. |
