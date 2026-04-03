# AGENTS.md

This file is the operational guide for human contributors and AI coding assistants working on `web-spatial-viewer`.

## Project mission

`web-spatial-viewer` is a spatial browser simulator and inspector inspired by:
- Safari on Apple Vision Pro
- the Web Spatial SDK ecosystem, including `webspatial.dev`

The project runs on Windows and standard browsers, without requiring Apple hardware. It aims to:
- simulate a credible spatial browser UI and navigation model
- emulate selected immersive Safari / Web Spatial behaviors in a controlled environment
- provide an inspector-like experience that may later be open sourced broadly or exposed as SaaS

This project should not claim perfect Apple fidelity unless the relevant behavior has been explicitly validated.

## Three levels of truth

When making product, architecture, or testing decisions, always distinguish between these three levels of truth:

### 1. Internal truth
The code behaves according to the contracts defined by this repository.

Examples:
- the proxy resolves URLs consistently
- the bridge handshake works
- back/forward updates local history as expected
- the splash screen hides after `NETWORK_IDLE`

### 2. Compatibility truth
The viewer behaves in a way that is compatible with the expected contract of Web Spatial apps or related SDK conventions.

Examples:
- manifest discovery works
- `window.__webspatialsdk__` is detected and forwarded
- page sizing honors `xr_main_scene.default_size`

### 3. Apple truth
The simulator resembles Safari visionOS or Apple Vision Pro immersive browser behavior.

This must itself be split into two separate goals:
- the simulator looks and behaves like a credible browser chrome / browser UX
- the simulator emulates immersive Safari-specific capabilities

Apple truth is always partial unless validated with strong evidence. Do not present assumptions as facts.

## Current architecture overview

The project currently contains five main subsystems:

1. **Frontend viewer**
   - React + Vite + TypeScript
   - Zustand stores
   - React Three Fiber scene
   - `@react-three/uikit` based browser chrome

2. **3D browser surface**
   - a 3D frame rendered in R3F
   - a `drei/Html` cut-out used to display a proxified iframe

3. **Proxy server**
   - Express server
   - resolves local proxy hosts into target URLs
   - injects the bridge script into HTML
   - proxies resources
   - streams loading progress with SSE

4. **Bridge**
   - injected into proxified pages
   - forwards navigation and lifecycle messages
   - detects Web Spatial / manifest hints
   - receives viewer commands like back / forward

5. **PWA / manifest layer**
   - loads and normalizes manifest data
   - provides splash data and spatial sizing hints

## Core engineering principles

### Prefer contracts over guesswork
If a behavior matters, define it as a contract:
- input
- output
- side effects
- known limitations

This is especially important for:
- bridge messages
- proxified URL formats
- manifest handling
- navigation history rules

### Separate logic from effects
Whenever possible, extract pure logic from components or server handlers so it can be unit tested.

Examples of good candidates:
- host-to-target URL resolution
- proxy URL rewriting
- bridge payload validation
- HTML injection / rewriting helpers
- manifest normalization

### Avoid hidden truth claims
Do not state or imply that a feature matches Safari visionOS exactly unless the behavior has been explicitly verified.

Preferred language:
- "simulates"
- "approximates"
- "compatible with"
- "currently modeled as"

Avoid language like:
- "works exactly like Safari"
- "identical to Apple Vision Pro"

### Keep the repo testable on non-Apple hardware
Every contribution should preserve a reasonable local workflow on Windows and mainstream browsers.

## Contribution priorities

Contributions should generally improve one or more of the following:
- contract clarity
- testability
- reliability of navigation/proxy/bridge behavior
- quality and coherence of the browser chrome UX
- explicit documentation of limitations and fidelity gaps

## What an AI assistant should do before changing code

Before making non-trivial changes, inspect:
- `server/server.ts`
- `src/lib/spatial-viewer-bridge.ts`
- `src/store/pages.store.ts`
- `src/store/pwa.store.ts`
- `src/components/WebFrame.tsx`
- `src/components/NavBar3D.tsx`
- `types/bridge.d.ts`
- `docs/testing-strategy.md`

For architecture-sensitive changes, first explain which subsystem is being modified and which level of truth is affected.

## Testing policy

Use the lightest test layer that can actually validate the behavior.

### Unit tests
Use for:
- pure URL helpers
- manifest normalization
- store transitions
- message serialization / validation

### Integration tests
Use for:
- Express proxy behavior
- HTML injection
- SSE progress events
- bridge contract boundaries

### R3F structural tests
Use for:
- scene graph presence
- props wiring
- button enabled / disabled states in 3D UI
- smoke tests for 3D component composition

These tests do **not** prove visual correctness.

### Browser end-to-end tests
Use for:
- iframe + proxy + bridge behavior
- actual navigation
- splash screen timing
- clipboard, reload, back/forward
- browser-like UX
- screenshot-based visual regression

## Preferred testing stack

The current direction is:
- `vitest` for logic and component tests
- `@react-three/test-renderer` for R3F structural assertions
- `supertest` for Express integration tests
- `playwright` for end-to-end and visual regression

Do not migrate to Babylon.js only for testability reasons. Babylon's headless tools are useful, but this project is primarily a React application with a hybrid DOM + iframe + proxy + 3D architecture.

## Expected documentation when adding a feature

For meaningful new features, contributors should update at least one of:
- `README.md`
- `docs/testing-strategy.md`
- a future compatibility matrix document
- inline contract comments near the relevant code

If a feature introduces a limitation or approximation, document it explicitly.

## Known sensitive areas

Be extra careful when changing:
- `postMessage` origin checks
- bridge handshake flow
- history synchronization between iframe and viewer
- regex or parsing used for HTML rewriting
- proxified host mapping
- any assumption about domains or subdomains
- any statement about Apple fidelity

## Style guidelines for changes

- Prefer small focused PRs
- Keep user-facing comments factual and modest
- Avoid over-engineering before contracts are written down
- Preserve existing terminology where possible: viewer, bridge, proxy, page, manifest, splash, browser chrome
- When introducing new abstractions, explain why they improve testability or clarity

## If you are unsure

If uncertain whether a behavior is:
- internal truth,
- compatibility truth,
- or Apple truth,

say so explicitly in code comments, docs, or PR notes.

Uncertainty that is documented is far better than confidence that is invented.
