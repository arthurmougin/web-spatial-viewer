# Testing strategy

This document defines how `web-spatial-viewer` should be tested across its full architecture.

The goal is not to maximize the raw number of tests. The goal is to build confidence in the behaviors that matter most for a spatial browser simulator running without Apple hardware.

---

## 1. Testing philosophy

This project should be tested according to the **smallest reliable layer** that can validate a behavior.

That means:
- use **unit tests** for pure logic
- use **integration tests** for boundaries between modules
- use **R3F structural tests** for scene composition
- use **browser E2E tests** for anything involving real browser behavior, iframe integration, or visual confidence

Trying to prove everything at the wrong level leads to brittle or misleading tests.

---

## 2. Three levels of truth

All tests should implicitly or explicitly target one of these truth levels.

### Internal truth
The system behaves according to the contracts defined in this repository.

Examples:
- URLs are proxified and unproxified consistently
- the bridge handshake works
- navigation state updates correctly
- the splash screen responds to progress and idle messages

### Compatibility truth
The simulator behaves in a way that is compatible with Web Spatial or related app expectations.

Examples:
- manifest discovery and parsing
- SDK signature forwarding
- spatial sizing hints from `xr_main_scene.default_size`

### Apple truth
The simulator resembles Safari visionOS behavior.

This should be split into two distinct verification targets:

#### Apple truth A: browser credibility
The simulator looks and behaves like a coherent browser.

Examples:
- navigation controls
- chrome behavior
- loading state
- copy URL / new tab / close interactions

#### Apple truth B: immersive Safari emulation
The simulator approximates immersive Safari / Web Spatial behavior.

Examples:
- spatial sizing
- immersive UI conventions
- Web Spatial feature shims or forwarding

Only a subset of Apple truth can be automated without real Apple hardware. Tests must stay honest about that.

---

## 3. Architectural test layers

This repository currently contains five major subsystems.

1. frontend React app
2. 3D scene and browser chrome
3. injected bridge script
4. Express proxy server
5. PWA / manifest integration

Each subsystem has a preferred test strategy.

---

## 4. Unit tests

### Purpose
Unit tests validate pure logic with minimal environment assumptions.

### Tooling
- `vitest`
- `happy-dom` where a lightweight browser environment is enough

### Best candidates in the current repo

#### `src/utils/proxy.utils.ts`
Test:
- valid proxification
- unproxification
- preservation of pathname and query string
- `pageId` injection
- invalid input handling
- unusual subdomain cases

Important edge cases:
- multiple subdomains
- localhost assumptions
- domains that do not fit the simplistic two-part TLD model

#### `src/utils/pwa.utils.ts`
Test:
- manifest fetch success and failure
- relative icon path normalization
- `scope` derivation fallback
- `isUrlInScope`
- `getLoadingIcon`

#### `src/store/pages.store.ts`
Test:
- first page submission
- page add/remove
- navigation history transitions for `push`, `replace`, `pop`
- progress updates
- disposal behavior when replacing pages

#### Future extracted helpers from `server/server.ts`
These should become unit-testable pure functions:
- host-to-target resolution
- HTML script injection
- absolute URL rewriting
- SSE event payload formatting

### What unit tests should not try to prove
Unit tests should not try to prove:
- actual browser rendering
- iframe behavior
- real `postMessage` routing across origins
- Safari-like UX fidelity

---

## 5. Integration tests

### Purpose
Integration tests validate interactions between a few modules without running the full product in a real browser.

### Tooling
- `vitest`
- `supertest`
- test doubles for `fetch`
- lightweight DOM mocks when necessary

### Primary targets

#### Express proxy server
Current file: `server/server.ts`

Recommended next step:
Refactor the file so the Express app can be imported without auto-starting the server. This will make `supertest` usage much easier.

Test scenarios:
- SSE connection lifecycle on `/events/:pageId`
- HTML request detection by `Accept` header
- HTML fetch and bridge injection
- fallback to resource proxy on 404 HTML response
- resource proxy success and failure
- content-type propagation
- invalid host format rejection

#### Bridge contract boundaries
Current file: `src/lib/spatial-viewer-bridge.ts`

Test scenarios:
- `INIT` sent on startup
- backlog behavior before ID attribution
- backlog flush after `ID_ATTRIBUTION`
- `pushState` / `replaceState` interception
- `popstate` forwarding
- command handling for `GO_BACK` / `GO_FORWARD`

Recommended improvement:
Introduce runtime validation for bridge messages so malformed payloads fail loudly and predictably.

#### Page listener
Current file: `src/classes/page-listener.ts`

Test scenarios:
- origin filtering
- iframe ID matching
- handling of `INIT`
- handling of `NETWORK_IDLE`
- handling of `NAVIGATE`
- ignoring unrelated page IDs

---

## 6. R3F structural tests

### Purpose
These tests validate the structure and wiring of the 3D React scene, not the final rendered image.

### Tooling
- `@react-three/test-renderer`
- `vitest`

### Why this layer matters
The project uses React Three Fiber as part of a larger React application. It is useful to test:
- whether expected 3D components are present
- whether props are forwarded correctly
- whether a 3D UI state is coherent

### Good candidates

#### `src/components/NavBar3D.tsx`
Test:
- back/forward disabled state
- secure vs non-secure icon mode
- URL display fallback
- button callback wiring
- structural presence of expected control groups

#### `src/components/Scene3D.tsx`
Test:
- page-driven frame rendering
- presence of controls / environment
- smoke test for a minimal scene

### Limited value candidates

#### `src/components/WebFrame.tsx`
This file mixes:
- iframe behavior
- `Html` from drei
- clipboard
- EventSource
- manifest-driven layout
- viewer store updates

Use only very light structural smoke tests here. Real confidence should come from browser E2E.

### What R3F structural tests do not prove
They do not prove:
- visual correctness
- shader output
- hit testing behavior in a real browser
- occlusion behavior of `Html`
- actual iframe integration

---

## 7. Browser end-to-end tests

### Purpose
This is the most important test layer for the project.

It validates the actual simulator behavior in a real browser environment.

### Tooling
- `playwright`
- screenshot assertions for visual regression
- local fixture pages

### Why this layer is critical
The core promise of the project depends on real browser interactions:
- iframe loading
- proxified navigation
- script injection
- message passing
- visual browser-like UX

No amount of unit testing can replace this.

### Required fixture pages
Create a local test fixture app set including at least:

1. **simple-static**
   - one HTML page
   - predictable title/content

2. **spa-history**
   - uses `pushState`, `replaceState`, and `popstate`
   - no full reloads

3. **pwa-basic**
   - `manifest.webmanifest`
   - icons
   - `xr_main_scene.default_size`

4. **sdk-signature**
   - defines `window.__webspatialsdk__`
   - allows testing handshake forwarding

5. **stress-urls**
   - absolute links
   - relative links
   - query strings
   - resource references

6. **failure-case**
   - no manifest
   - slow load or intentionally broken resource

### Core E2E scenarios

#### Browser credibility suite
These tests cover Apple truth A.

- load a page through the search bar
- show the expected domain in the 3D chrome
- support reload
- support back/forward on SPA history
- close a page cleanly
- copy the visible URL
- open a clean new tab from the viewer
- hide the splash screen after load completes

#### Immersive emulation suite
These tests cover compatibility truth and Apple truth B.

- detect and forward SDK signature
- load manifest data
- use icon/name in splash UI
- apply `xr_main_scene.default_size`
- keep the overall viewer behavior stable when immersive hints are absent

#### Proxy reliability suite
These tests cover internal truth.

- target URL resolution via local proxy host
- injection of `spatial-viewer-bridge.js`
- resource proxy still works for non-HTML assets
- HTML fallback logic on 404

### Visual regression
Use screenshot tests for:
- nav bar default state
- nav bar with disabled buttons
- secure vs non-secure URL display
- splash screen visible
- loaded page frame visible
- different manifest-driven sizes

These screenshot tests do not prove Apple fidelity, but they are excellent for detecting regressions in browser credibility.

---

## 8. Visual fidelity testing

### Goal
Visual fidelity testing should answer:
- does the simulator still look coherent?
- did a change break layout, alignment, translucency approximation, or proportions?

### Suggested approach
Use Playwright screenshot baselines for stable scenes and fixture pages.

Recommended baseline categories:
- empty state / welcome state
- single loaded page
- splash loading state
- small, medium, and large spatial frame sizes
- error or degraded state

### Important honesty rule
A passing visual regression test means:
- the project still matches its own baseline

It does **not** mean:
- the project now matches Apple Safari exactly

---

## 9. Performance testing

### Why performance matters
A spatial browser simulator that feels laggy loses credibility quickly.

### What to track first
Use lightweight repeatable checks for:
- time to first visible frame
- time to splash completion
- proxy fetch duration
- resource fetch duration
- cost of reload
- frame stability during basic interaction

### How to start simply
Start with developer-observable budgets and logs before building a dedicated benchmark suite.

The first goal is trend detection, not perfect benchmarking.

---

## 10. Security and robustness testing

### Areas to treat as sensitive
- `postMessage` origin filtering
- iframe/viewer message routing
- HTML rewriting
- proxy host parsing
- navigation synchronization

### Minimum robustness scenarios
Test that the app behaves safely when:
- a message comes from the wrong origin
- a message has the wrong shape
- the manifest cannot be fetched
- the SDK signature is missing
- a page never emits expected lifecycle signals
- a proxified host is malformed
- a page performs unusual history manipulations

---

## 11. Recommended roadmap

### Phase 1 — immediate value
- add tests for `proxy.utils.ts`
- add tests for `pwa.utils.ts`
- add tests for `pages.store.ts`
- refactor `server/server.ts` to make its internals testable

### Phase 2 — contract confidence
- test `PageListener`
- test bridge handshake logic
- introduce runtime validation for bridge payloads
- document bridge message invariants

### Phase 3 — browser confidence
- add Playwright
- add local fixture pages
- implement browser credibility E2E suite

### Phase 4 — visual confidence
- add screenshot baselines
- cover key chrome and splash states

### Phase 5 — fidelity and compatibility clarity
- add a compatibility matrix
- classify features as supported / partial / unsupported / unverified

---

## 12. Recommended test ownership by file

### Unit / integration first
- `src/utils/proxy.utils.ts`
- `src/utils/pwa.utils.ts`
- `src/store/pages.store.ts`
- `src/classes/page-listener.ts`
- extracted helpers from `server/server.ts`

### R3F structural tests
- `src/components/NavBar3D.tsx`
- `src/components/Scene3D.tsx`

### Browser E2E first-class targets
- `src/components/WebFrame.tsx`
- `src/lib/spatial-viewer-bridge.ts`
- the running proxy server
- the full viewer loaded through Vite

---

## 13. Definition of done for new features

A feature should usually not be considered done until it includes:
- an explicit contract or limitation statement
- at least one relevant test at the correct layer
- documentation updates if the behavior is user-visible or architecture-sensitive

For Apple-truth-related features, also document whether the feature is:
- inferred
- approximated
- or externally validated

---

## 14. Final principle

A smaller honest test suite is better than a large suite that pretends to prove things it cannot actually prove.

This project should optimize for:
- trustworthiness
- clarity
- maintainability
- confidence at the right layers

not for vanity coverage alone.
