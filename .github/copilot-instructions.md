# Copilot Instructions — web-spatial-viewer

## Project Goal

A developer-focused emulator that approximates the Safari / Apple Vision Pro browsing experience enough to let developers on **Windows (no headset)** inspect spatially aware websites.

This is **not** a full Safari clone, not a WebXR emulator, not an official WebSpatial-compatible runtime.  
Every feature must be labeled: _Confirmed / Approximated / Mocked / Out of scope_.

See `docs/` for full architecture, capability matrix, and roadmap.

---

## Project Stack

- **Framework**: React 19 + TypeScript (strict)
- **3D**: Three.js via React Three Fiber (`@react-three/fiber`)
- **3D Helpers**: `@react-three/drei` (Html, OrbitControls, Text3D, Center)
- **State**: Zustand v5
- **Styling**: CSS Modules for non-spatial overlays (e.g. `SearchBar.module.css`); Tailwind 4 for utility components (e.g. `progress.tsx`). **Do not use CSS Modules for the in-window 3D browser chrome — that must use `@react-three/uikit`**.
- **3D spatial UI**: `@react-three/uikit` + `@react-three/uikit-default` + `@react-three/uikit-lucide` for the browser chrome rendered inside the R3F scene
- **Build**: Vite 7 (viewer + bridge built from same `vite.config.ts`)
- **Proxy server**: Express 5 + tsx (Node, port 3000)

---

## Three-Layer Architecture

| Layer              | Where runs  | Entry point                        |
| ------------------ | ----------- | ---------------------------------- |
| Proxy server       | Node        | `server/server.ts` → port 3000     |
| Viewer (front-end) | Browser     | `src/main.tsx` → port 5173         |
| Bridge (injected)  | Page iframe | `src/lib/spatial-viewer-bridge.ts` |

**URL convention**: `https://foo.bar.com` → `http://foo--bar-com.localhost:3000`  
Both sides share proxification logic: `src/utils/proxy.utils.ts` (client) and `server/server.ts` (server).

---

## Message Protocol Summary

```
Bridge (iframe) → Viewer: INIT (manifest URL + WebSpatial SDK signature)
Viewer → Bridge:          ID_ATTRIBUTION (assigns page id)
Bridge → Viewer:          NETWORK_IDLE (window.load fired → dismiss splash)
```

Types are defined in `types/bridge.d.ts`. All `IBridgeMessage.id` values are `number` (Date.now()).

SSE progress channel: `GET http://localhost:3000/events/:pageId`

---

## Key Files

```
server/server.ts                  Proxy: fetch → inject bridge → rewrite URLs → serve
src/components/WebFrame.tsx       Three.js spatial window: NavBar3D (uikit) + iframe
src/components/NavBar3D.tsx       uikit-based 3D browser chrome (R3F / uikit) — primary implementation
src/components/NavBar.tsx         Legacy HTML/CSS nav bar — NOT the intended architecture
src/components/NavBar.module.css  CSS for the legacy HTML nav bar — NOT the intended architecture
src/components/Scene3D.tsx        R3F canvas (skybox + WebFrames + OrbitControls)
src/classes/page-listener.ts      postMessage handler per iframe
src/classes/progress-listener.ts  SSE client per page
src/store/pages.store.ts          Page lifecycle state (Zustand)
src/store/pwa.store.ts            PWA manifest + WebSpatial SDK detection
src/lib/spatial-viewer-bridge.ts  Script injected into every proxified page
src/utils/proxy.utils.ts          Client-side URL proxification
types/bridge.d.ts                 Bridge message protocol types
types/pwa.d.ts                    Web Manifest type (+ xr_main_scene extension)
docs/                             Architecture, capability matrix, roadmap
```

---

## Design Reference — Apple visionOS UI Kit

### Source Figma

- **File**: Apple Vision OS Design - Ui Ux Kit (Community)
- **URL**: https://www.figma.com/design/i8VJ8ZvdY7CeJmuXu6SkmJ/Apple-Vision-OS-Design--Ui-Ux-Kit---Community-?node-id=1-101
- **Node**: `1:101` — `Safari.app - Browsing`

### Design Tokens

| Token                     | Value                          |
| ------------------------- | ------------------------------ |
| `material-glass`          | `backdrop-filter: blur(100px)` |
| `White Shade/Opacity 25%` | `rgba(255,255,255,0.25)`       |
| `White Shade/Opacity 10%` | `rgba(255,255,255,0.10)`       |

### Color Palette

| Usage                    | Value                                    |
| ------------------------ | ---------------------------------------- |
| Dark overlay (window bg) | `rgba(0,0,0,0.3)`                        |
| Nav bar bg               | `rgba(255,255,255,0.10)`                 |
| Nav bar inset highlight  | `inset 1px 1px 0 rgba(255,255,255,0.35)` |
| Icon button bg           | `rgba(255,255,255,0.25)`                 |
| URL bar bg               | `rgba(101,99,92,0.6)`                    |
| URL bar inset shadow     | `inset 0 3px 4px rgba(52,50,50,0.35)`    |
| Icon tint (secondary)    | `#93928e`                                |
| Text / icons             | `#FFFFFF`                                |

### Typography

- `font-family: 'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif`
- URL bar domain: SF Pro Display Medium, 15px, `letter-spacing: -0.4px`

### Component Specs

#### Navigation Bar (pill) — uikit implementation target

- Height: 44px
- Layout in uikit: `<group position={...}><Container flexDirection="row">` with nested `<Container>` groups for left/right controls and URL bar
- Left group: Back, Forward, Reload — Right group: Share, New Tab, Close
- Visual target (from Figma): pill shape, semi-transparent background, icon buttons as circles
- Translucency in uikit: approximate via `opacity` prop (per-element panel alpha). CSS `backdrop-filter` is a native browser feature that cannot be used in WebGL rendering.
- Note: `Root` is deprecated in uikit v1.x — use `Container`. Position via `<group position={...}>` wrapper.

#### Icon Buttons — uikit implementation target

- 32×32px, circle (`borderRadius={999}` in uikit)
- Background: `backgroundColor="#ffffff" opacity={0.25}`
- Hover/active: `hover={{ opacity: 0.35 }}` / `active={{ opacity: 0.45 }}`
- Icons: from `@react-three/uikit-lucide`, 14px, white

#### URL Bar — uikit implementation target

- Pill container, `flexGrow={1}` (note: `flex` shorthand does not exist in uikit v1.x)
- Background: `backgroundColor="#65635c" opacity={0.6}`
- Left: lock/globe icon · Center: domain Text · Right: copy icon

### Design Token Translation for uikit

Since uikit renders in WebGL (no CSS), Figma design tokens translate as follows:

| Figma token               | CSS equivalent                 | uikit approximation                                                       |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| `material-glass`          | `backdrop-filter: blur(100px)` | Not reproducible in WebGL — use opacity instead                           |
| `White Shade/Opacity 25%` | `rgba(255,255,255,0.25)`       | `backgroundColor="#ffffff" opacity={0.25}`                                |
| `White Shade/Opacity 10%` | `rgba(255,255,255,0.10)`       | `backgroundColor="#ffffff" opacity={0.1}`                                 |
| `border-radius: 9999px`   | Pill shape                     | `borderRadius={999}` in uikit                                             |
| `box-shadow: inset ...`   | Inset border highlight         | Not directly supported — use `borderWidth`/`borderColor` as approximation |

---

## Important Rules for Copilot

1. **Never conflate** native Safari behavior / WebXR / spatial-web features / WebSpatial.
2. If porting a native feature: label it explicitly as _Approximated_, _Mocked_, or _Out of scope_.
3. **Do not add CSS Modules or Tailwind to 3D browser chrome components** — the spatial browser chrome (nav bar, buttons, labels inside `WebFrame`) must use `@react-three/uikit`.
4. `IBridgeMessage.id` is `number` (not UUID). Use `Date.now()` for new page IDs.
5. The proxy uses subdomain encoding — `proxyFyUrl()` and `UnProxyFyUrl()` are in `src/utils/proxy.utils.ts`.
6. `removePage()` takes a `URL` object constructed from the proxified URL string.
7. Back/Forward buttons send `GO_BACK`/`GO_FORWARD` bridge messages. Navigation history is tracked in `pages.store.ts`. This is a SPA-only approximation.
8. `NavBar.tsx` + `NavBar.module.css` are **legacy HTML/CSS experiments** and are **not the intended architecture**. The intended chrome is `NavBar3D.tsx` using `@react-three/uikit`.
9. CSS Modules are correct for non-spatial overlays only: `SearchBar.module.css` (top-level URL overlay) and similar DOM-level UI.
