# Roadmap — web-spatial-viewer

> Last updated: 2026-03-26  
> Principle: stabilize and clarify before expanding. No greenfield rewrites.

---

## Near-Term MVP (stabilization + browser chrome)

These items are directly actionable today, without major architectural changes.

### Track A — Browser shell

| Item                                               | Status     | Action                                                                                                                                    | Value             |
| -------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Fix `lib:watch` output filename mismatch           | **Done** ✔ | `vite.lib.config.ts` updated to output `dist/lib/spatial-viewer-bridge.js`                                                                | Low friction      |
| uikit browser chrome (glassmorphism approximation) | **Done** ✔ | `NavBar3D.tsx` with uikit `Container`/`Text`/icon primitives. `backdrop-filter` not possible in WebGL — approximated via uikit `opacity`. | High visual value |
| Remove legacy `NavBar.tsx` + `NavBar.module.css`   | Missing    | Quarantine or delete once uikit chrome is confirmed stable                                                                                | Hygiene           |
| Display de-proxified URL in chrome                 | **Done** ✔ | `UnProxyFyUrl()` applied in `WebFrame.tsx`                                                                                                | UX correctness    |
| Wire Reload button                                 | **Done** ✔ | `handleReload()` in `WebFrame.tsx`                                                                                                        | Essential feature |
| Wire Close button                                  | **Done** ✔ | `handleClose()` → `removePage()` in `WebFrame.tsx`                                                                                        | Essential feature |
| Wire Back / Forward buttons (SPA navigations only) | **Done** ✔ | `NAVIGATE`/`GO_BACK`/`GO_FORWARD` bridge messages; history stack in store                                                                 | Essential feature |
| Fix bridge `private id: string \| null` type       | **Done** ✔ | Changed to `number \| null` in `spatial-viewer-bridge.ts`                                                                                 | Type correctness  |
| Add `chalk` to `package.json` dependencies         | **Done** ✔ | Added as explicit dependency                                                                                                              | Correctness       |
| Home indicator ornament                            | Missing    | Simple uikit Container matching Figma spec — do NOT use HTML/CSS for this                                                                 | Design fidelity   |

### Track B — Page bridge / proxy

| Item                                      | Status     | Action                                                                                              | Value                |
| ----------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- | -------------------- |
| Strip/relax CSP headers in proxy response | Missing    | Remove or relax `Content-Security-Policy` and `X-Frame-Options` headers from proxied responses      | Unblocks many sites  |
| Add `NAVIGATE` bridge message type        | Missing    | Intercept `history.pushState`, `location.assign`, `popstate` in bridge                              | Enables back/forward |
| Fix `IBridgeMessage.id` type in bridge    | **Done** ✔ | `types/bridge.d.ts` already uses `id: number`. Bridge class internal field needs fix (see Track A). | Type correctness     |

---

## Medium-Term: Fidelity Improvements

### Track A — Browser shell

| Item                                      | Status             | Dependencies                                                                           | Value                                | Confidence |
| ----------------------------------------- | ------------------ | -------------------------------------------------------------------------------------- | ------------------------------------ | ---------- |
| Back / Forward with navigation history    | **Partial done** ✔ | `NAVIGATE`/`GO_BACK`/`GO_FORWARD` — implemented for SPA; full-page reloads not tracked | High — essential browser feature     | Medium     |
| Editable URL bar in chrome                | Missing            | None                                                                                   | High — allows navigation from chrome | High       |
| Page title sync                           | Missing            | Add `TITLE_CHANGE` bridge message                                                      | Medium                               | Medium     |
| Favicon display in URL bar                | Missing            | Add favicon URL to bridge INIT                                                         | Medium                               | Medium     |
| Loading indicator in URL bar (not splash) | Missing            | Progress data already exists                                                           | Medium                               | High       |
| Multi-window (open several pages)         | Missing            | Already in store, needs UI                                                             | Medium                               | Medium     |
| Error page / loading error state          | Missing            | Proxy already returns error status                                                     | Medium                               | High       |

### Track B — Page bridge / proxy

| Item                                               | Dependencies                    | Value                               | Confidence |
| -------------------------------------------------- | ------------------------------- | ----------------------------------- | ---------- |
| Console log forwarding to viewer devtools panel    | None                            | High for debugging                  | High       |
| JS error forwarding (`window.onerror`)             | None                            | High for debugging                  | High       |
| Smarter URL rewriting (attribute-aware, not regex) | Cheerio already in dependencies | Medium — reduces breakage           | Medium     |
| `pageId` query param stripping from proxied URLs   | None                            | Low — avoids leaking internal param | Medium     |
| HTTPS proxy mode (for WebXR `isSessionSupported`)  | Self-signed cert or mkcert      | Medium                              | Medium     |

### Track C — Safari spatial-web approximation

These are **project-specific approximations** of native Safari/visionOS behavior. They are not faithful reproductions.

| Item                                                             | Classification | Value                    | Feasibility (no headset)          | Order                      |
| ---------------------------------------------------------------- | -------------- | ------------------------ | --------------------------------- | -------------------------- |
| CSS `cursor: pointer` interaction region highlight               | Approximated   | Medium                   | High — CSS overlay                | After chrome stabilization |
| `rel="spatial-backdrop"` — swap skybox background                | Approximated   | High — visual wow factor | High — R3F skybox already exists  | After chrome stabilization |
| Interaction cue affordances (hover ring on interactive elements) | Approximated   | Medium                   | Medium — CSS injection via bridge | Later                      |
| `<model>` element basic support (Three.js object)                | Approximated   | Medium                   | Medium — R3F already in project   | Later                      |

---

## Long-Term: Experimental Immersive Features

### Track C (continued) — Spatial-web approximation

| Item                                               | Classification            | Technical note                               | Feasibility | Confidence |
| -------------------------------------------------- | ------------------------- | -------------------------------------------- | ----------- | ---------- |
| Website environment / backdrop full implementation | Approximated — not native | Custom R3F environment + page-supplied image | Medium      | Low        |
| Model environment lighting (approximated)          | Mocked                    | R3F environment map + HDRI                   | Medium      | Low        |
| Spatial Browsing mode mock                         | Mocked                    | CSS transform + layout override injection    | Low         | Low        |

### Track D — WebXR developer ergonomics

| Item                                                 | Classification                 | Technical note                            | Feasibility          | Confidence                    |
| ---------------------------------------------------- | ------------------------------ | ----------------------------------------- | -------------------- | ----------------------------- |
| WebXR session launch flow simulation                 | Project-specific approximation | Show overlay requesting "enter immersive" | High                 | High                          |
| Secure context simulation (HTTPS proxy)              | Infrastructure concern         | mkcert + local HTTPS                      | Medium               | Medium                        |
| Transient pointer mock (mouse → pointer abstraction) | Mocked                         | Mouse events relabeled as pointer input   | High                 | Medium                        |
| `navigator.xr.isSessionSupported()` bridge override  | Project-specific approximation | Override in bridge script                 | Medium — may mislead | Low — risk of false positives |
| Hand tracking simulation                             | Out of scope                   | No hardware access possible               | None                 | —                             |

> **Note:** Any WebXR override must be clearly labeled in-browser as an emulated/mocked value. Misleading a site into thinking real XR is available would cause incorrect behavior.

### Track E — WebSpatial-inspired support

These are **inspiration**, not official WebSpatial compatibility. Label all as "inspired by WebSpatial, not compatible."

| Item                                                       | Classification                      | Technical note                                             | Feasibility | Confidence |
| ---------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- | ----------- | ---------- |
| `enable-xr` marker detection + CSS elevation approximation | WebSpatial-inspired, not compatible | Bridge detects attr, viewer applies Z offset               | Medium      | Medium     |
| `--xr-background-material` CSS var injection               | WebSpatial-inspired, not compatible | Bridge injects fallback value                              | High        | High       |
| `--xr-back` depth offset approximation                     | WebSpatial-inspired, not compatible | CSS `translateZ` injection via bridge                      | High        | Medium     |
| Scene abstraction (multiple spatial windows from one URL)  | WebSpatial-inspired, not compatible | Multi-window from store, already partial                   | Medium      | High       |
| App Shell handshake improvement                            | WebSpatial-inspired pattern         | Formalize bridge protocol to resemble WebSpatial App Shell | Medium      | Medium     |
| Full WebSpatial React SDK compatibility                    | Out of scope                        | Would require running full WebSpatial runtime              | None        | —          |

---

## Decisions and Constraints

- **CSP blocking sites:** The biggest practical blockers are CSP headers and `X-Frame-Options`. Stripping these in the proxy is the highest-leverage near-term fix for site compatibility.
- **No real hand tracking / eye tracking:** These are fundamentally out of scope for any browser-only tool. Do not mock them in ways that mislead developers about real behavior.
- **WebXR overrides:** Any bridge-level override of `navigator.xr.*` must show a clear in-page banner that the environment is mocked to prevent misinterpretation of test results.
- **WebSpatial compatibility:** There is no official compatibility with the WebSpatial SDK today. All features are labeled "inspired by" or "project-specific approximation."
