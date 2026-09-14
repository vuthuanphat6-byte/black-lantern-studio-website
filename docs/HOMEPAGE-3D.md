# Homepage redesign — 2026-09-14

## Design

An editorial, cinematic homepage with oversized Vietnamese serif typography,
copper light, a dark landscape, a dimensional project card and an arched studio
portrait. The Cyno relationship, original studio logo and concept-art disclosure
remain intact. No released game or launch date is implied.

## 3D and accessibility

- Two decorative lanterns use 24 CSS faces, caps, suspension loops and tassels.
- CSS transforms provide perspective; fine-pointer input adds bounded tilt.
- The project card has a subtle pointer tilt, without hijacking scrolling.
- Motion can be paused. System reduced-motion preferences disable animation and
  tilt, and hide the redundant animation control.
- Animation pauses when the hero is offscreen or the document is hidden.
- Content and decorative geometry render without JavaScript. No WebGL, canvas,
  third-party script, new dependency or remote asset is required.
- CSP remains unchanged; styles are bundled and scripts use existing CSP hashes.

## Verification

- Build: 12 HTML pages checked for metadata, H1, structured data and local links.
- Tests: 17 passing, including compiled motion controller tests with DOM mocks.
- Browser: desktop 1280px and mobile 390px/320px; no horizontal document overflow,
  broken loaded images or console errors observed. Mobile menu opens and closes.
- System reduced-motion behavior was checked in the browser. Normal-motion state
  transitions and tilt limits were checked with the compiled-controller tests.
- Previous Lighthouse scores are not new measurements of this redesign.

Primary files: `src/pages/index.astro`, `src/styles/home.css`,
`src/components/LanternScene.astro`, `src/scripts/home-motion.ts`.
