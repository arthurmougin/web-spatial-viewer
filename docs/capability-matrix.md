# Capability Matrix — web-spatial-viewer

> Last updated: 2026-03-26  
> Classification: Confirmed / Partial / Missing / Out of scope

For each feature, four columns are compared:

| Column                     | Meaning                                                  |
| -------------------------- | -------------------------------------------------------- |
| **Native target**          | What Safari / visionOS actually does                     |
| **This project today**     | What this project actually does (evidence-based)         |
| **Possible approximation** | What could be approximated in a browser-only environment |
| **Scope**                  | Whether it is in scope for this project                  |

---

## A. Browser Shell

| Feature                              | Native target                             | This project today                                                                                                                                                                                 | Possible approximation            | Scope                       |
| ------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------- |
| Spatial window rendering             | Native visionOS window management         | Three.js canvas with iframe via drei `<Html>`                                                                                                                                                      | ✅ Approximated                   | In scope                    |
| Glassmorphism chrome                 | Native visionOS materials (OS-level blur) | **Partial** — uikit `Container` with `opacity` approximation. CSS `backdrop-filter` cannot be used in WebGL. `NavBar.module.css` exists as a legacy CSS experiment (not the architectural target). | ⚠️ Approximated via uikit opacity | In scope — partial          |
| Rounded window corners               | Native visionOS rounding                  | `RoundedPlaneGeometry` in Three.js                                                                                                                                                                 | ✅ Confirmed                      | In scope                    |
| visionOS window resize / focus modes | Native window manager                     | None                                                                                                                                                                                               | ⚠️ Partial mock possible          | Future scope                |
| Multi-window                         | Native multi-window support               | `pages.store` supports multi-page but not exposed                                                                                                                                                  | ⚠️ Store exists, UI missing       | In scope (future)           |
| 3D depth layering                    | Real OS depth compositing                 | None (flat canvas)                                                                                                                                                                                 | ⚠️ CSS `perspective` tricks only  | Out of scope (partial mock) |
| Home indicator                       | visionOS ornament                         | Not rendered                                                                                                                                                                                       | ✅ Simple HTML/CSS element        | In scope — missing          |

---

## B. Browser Chrome

| Feature            | Native target                | This project today                                                                                                                                   | Possible approximation              | Scope              |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------ |
| Back button        | Safari history.back()        | **Wired** — sends `GO_BACK` to bridge; bridge calls `history.back()`. History tracked in store. SPA navigations only; full-page reloads not tracked. | ✅ Partial                          | In scope — partial |
| Forward button     | Safari history.forward()     | **Wired** — sends `GO_FORWARD` to bridge; bridge calls `history.forward()`. Same SPA-only caveat.                                                    | ✅ Partial                          | In scope — partial |
| Reload button      | Safari reload                | **Wired** — `iframeRef.current.src = page.url`                                                                                                       | ✅ Confirmed                        | In scope — done    |
| URL bar (display)  | Shows real URL               | **Shows de-proxified URL** via `UnProxyFyUrl()`                                                                                                      | ✅ Confirmed                        | In scope — done    |
| URL bar (editable) | User can type new URL        | Top-level SearchBar only, not in 3D chrome                                                                                                           | ✅ Add input to chrome              | In scope (future)  |
| New tab button     | Opens new Safari tab         | Not wired                                                                                                                                            | ⚠️ Can add page to store            | Future scope       |
| Close button       | Closes window                | **Wired** — calls `removePage()` from store                                                                                                          | ✅ Confirmed                        | In scope — done    |
| Page title sync    | OS window title follows page | None                                                                                                                                                 | ✅ postMessage bridge title message | In scope (future)  |
| Favicon display    | Shows page favicon           | None                                                                                                                                                 | ✅ Parse from page HTML or bridge   | In scope (future)  |
| Loading indicator  | Progress bar in URL bar      | Splash screen only                                                                                                                                   | ✅ Progress bar in chrome           | Partial            |
| Error page         | Safari error page design     | None                                                                                                                                                 | ✅ Simple error overlay             | In scope (future)  |

---

## C. Proxy & Page Bridge

| Feature                      | Native target               | This project today                          | Possible approximation                 | Scope                       |
| ---------------------------- | --------------------------- | ------------------------------------------- | -------------------------------------- | --------------------------- |
| URL proxification            | Native same-origin          | Subdomain encoding to localhost             | ✅ Confirmed working                   | In scope                    |
| HTML URL rewriting           | Not applicable              | Regex replacement on served HTML            | ✅ Confirmed (fragile regex)           | In scope — improve          |
| Bridge script injection      | Not applicable              | `<script>` injected before `</head>`        | ✅ Confirmed                           | In scope                    |
| CSP handling                 | Browser enforces CSP        | Server does NOT strip CSP headers           | ⚠️ Many sites will block iframe        | Needs attention             |
| Navigation interception      | Safari controls browser nav | Not implemented in bridge                   | ✅ `pushState` intercept + postMessage | In scope (future)           |
| Console forwarding           | Native devtools             | Not implemented                             | ✅ Override `console.*` in bridge      | In scope (future)           |
| JS error forwarding          | Native devtools             | Not implemented                             | ✅ `window.onerror` in bridge          | In scope (future)           |
| Network idle detection       | Safari page lifecycle       | `window.load` event → NETWORK_IDLE          | ✅ Confirmed                           | In scope                    |
| PWA manifest parsing         | Safari reads manifest       | Confirmed: reads via bridge INIT            | ✅ Confirmed                           | In scope                    |
| Service worker / PWA install | Safari on visionOS supports | Not emulated                                | ⚠️ Complex, out of scope               | Out of scope                |
| WebSpatial SDK detection     | Not native Safari behavior  | `window.__webspatialsdk__` check            | ✅ Confirmed detection                 | In scope (project-specific) |
| xr_main_scene sizing         | Not a web standard          | Reads `manifest.xr_main_scene.default_size` | ✅ Confirmed (project-specific)        | In scope                    |
| SSE loading progress         | Not applicable              | Confirmed working                           | ✅ Confirmed                           | In scope                    |

---

## D. Spatial-Web Features (Safari / visionOS 26)

These are native Safari/visionOS platform features. They cannot be faithfully reproduced in a browser-only emulator.

| Feature                                                   | Native target                             | This project today | Possible approximation                         | Scope                        |
| --------------------------------------------------------- | ----------------------------------------- | ------------------ | ---------------------------------------------- | ---------------------------- |
| Spatial Browsing mode                                     | visionOS 26 — Reader-style spatial layout | Not implemented    | ❌ No platform access                          | Out of scope (mock possible) |
| `<model>` HTML element                                    | Native inline 3D model rendering          | Not implemented    | ⚠️ Could render Three.js model in overlay      | Experimental / future        |
| Model environment lighting                                | Native environment mapping                | Not implemented    | ❌ No platform access                          | Out of scope                 |
| Model animation playback                                  | Native model player                       | Not implemented    | ⚠️ Could wire to R3F animations                | Experimental / future        |
| Drag to Quick Look                                        | visionOS drag gesture                     | Not implemented    | ❌ No platform access                          | Out of scope                 |
| Spatial video playback                                    | Native visionOS video codec               | Not implemented    | ❌ No hardware/codec                           | Out of scope                 |
| Apple Immersive Video                                     | Native visionOS only                      | Not implemented    | ❌ Out of scope                                | Out of scope                 |
| Website environment / backdrop (`rel="spatial-backdrop"`) | visionOS 26 developer preview             | Not implemented    | ⚠️ Experimental mock with skybox swap possible | Future — experimental        |
| Eye + pinch interaction                                   | Native visionOS input model               | Not implemented    | ⚠️ Hover approximation only                    | Partial mock (future)        |
| Interaction regions (CSS `cursor: pointer`)               | Visual highlight on interactive elements  | Not implemented    | ⚠️ CSS overlay approximation                   | Future — experimental        |

---

## E. WebXR

| Feature                    | Native target                       | This project today                | Possible approximation          | Scope                 |
| -------------------------- | ----------------------------------- | --------------------------------- | ------------------------------- | --------------------- |
| WebXR immersive-vr session | Safari visionOS supports            | Not emulated                      | ⚠️ Can show launch flow only    | Partial / future      |
| WebXR hand tracking        | Real Vision Pro hands               | Not emulated                      | ❌ No hardware                  | Out of scope          |
| Transient pointer input    | visionOS simulator pointer          | Not emulated                      | ⚠️ Mouse events as pointer mock | Future                |
| Secure context requirement | Standard browser requirement        | Proxy uses HTTP (not HTTPS)       | ⚠️ Breaks WebXR APIs            | Known limitation      |
| WebXR feature detection    | `navigator.xr.isSessionSupported()` | Returns false in standard browser | ⚠️ Could override in bridge     | Future — experimental |

---

## F. WebSpatial-Inspired Features

These are inspired by the WebSpatial open-source project (https://webspatial.dev). They are project-specific approximations, not official WebSpatial compatibility.

| Feature                             | WebSpatial target                    | This project today                  | Possible approximation              | Scope                 |
| ----------------------------------- | ------------------------------------ | ----------------------------------- | ----------------------------------- | --------------------- |
| SDK signature detection             | `window.__webspatialsdk__`           | Confirmed: bridge detects it        | ✅ Confirmed                        | In scope              |
| App Shell / bridge pattern          | WebSpatial Builder injects App Shell | Proxy + bridge is a similar pattern | ✅ Structural similarity            | In scope              |
| `enable-xr` marker on HTML elements | Spatial elevation of marked elements | Not implemented                     | ⚠️ CSS overlay or R3F lift          | Future                |
| `--xr-background-material` CSS var  | Spatial material                     | Not implemented                     | ⚠️ Approximate with backdrop-filter | Future                |
| `--xr-back` CSS var                 | Z-axis positioning                   | Not implemented                     | ⚠️ CSS `translateZ` mock            | Future                |
| Full-space / AR session             | Not yet in WebSpatial docs           | Not implemented                     | ❌ Out of scope                     | Out of scope          |
| React SDK API                       | `@webspatial/*` packages             | Not implemented                     | ⚠️ Structural mocking only          | Future — experimental |
