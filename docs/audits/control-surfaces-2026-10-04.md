# Complete control surface audit

Reviewed on 4 October 2026 for the owner's organization-wide control task.

## Implementation

The reviewed control-surfaces stylesheet is the implementation source reused by the six other websites. It covers checkbox/radio marks, progress/meter parts, search clearing, file buttons, disclosures and scrollbars. Existing date/time/color controls and authored number steppers remain. Slider handles use the semantic focus token. Local specimen scrollbar overrides no longer restore platform buttons. Selection marks use the canvas token directly, so inherited text color cannot erase their contrast. The switch uses system colors in forced-colors mode so its knob stays visible. Published agent/component guidance, the catalog, translations and durable project rules were updated together.

## Approved standards

The offline installer applied the reviewed bundle from agent-standards commit `00fd107bfc651d4eb9cf7f34cf5e0a9f2ee93ee9`, digest `efe05f654da53716186663ff3186623e521003fbc82eedc624a4c46d0cc8adef`. Installation plans and doctor reports remain under the standards repository's ignored output. The imported owner-instruction block and owned snapshot were updated through that installer. Runtime Codex skill discovery remains NOT_RUN.

## Browser verification

The first exact-commit WebKit CI sweep reproduced a 360 px save-panel reading-width regression. Its non-overlay authored page scrollbar reduced the specimen's available width to 224.6 px, below the existing 234 px requirement. The save specimen now uses smaller outer preview padding under the existing narrow-screen breakpoint. Typography, document content, save controls, scrollbar visibility and the original assertion remain intact. Before captures and geometry remain under `before-save-fit/`.

Published QR screenshots exposed another shared-style issue. An absolutely positioned disclosure glyph ignored the host summary's padding and appeared above its text. The shared glyph now participates in normal inline text flow with an explicit value gap. This stylesheet correction is reused by all seven sites and has a permanent open/closed regression in `tests/control-surfaces.mjs`.

The local production-preview sweep covered 160 Chromium cases over routes `/`, `foundations/`, `components/`, `elements/`, `patterns/`, `agents/`, `brand/`, `404.html`, `vi/`, `vi/foundations/`, `vi/components/`, `vi/elements/`, `vi/patterns/`, `vi/agents/`, `vi/brand/`, `vi/404/` in both languages and both themes. It used 360 x 800, 390 x 844, 768 x 1024, 1024 x 768 and 1440 x 900. Each case traversed the whole page scroll range, captured full-page images or all segments of a long page, and checked page width, runtime errors, interface copy, control surfaces, ordinary indicators and the header.

A separate 60-capture state review exercised the changed and retained controls at 390 x 844 in Chromium, Firefox and WebKit, both locales and themes. Opened images and contact sheets were inspected.

Screenshots remain in `output/responsive/control-surfaces-2026-10-04/`, separated into immutable before captures, after captures, per-engine state images and forced-colors checks where relevant. The organization matrix and state reports remain in the QR Generator checkout's ignored output. Automated geometry is separate from visual inspection.

The local Chromium responsive suite passed 794 checks, localization passed its five unit cases and browser flow, and the indicator suite passed 36 cases. The new `tests/control-surfaces.mjs` passed 12 locale/theme cases across three engines and separately captured the system-color switch. CI runs it through `npm test` and retains its images.

## Publication and limits

Source checks and unit tests passed before commit. Website builds passed. Exact-commit CI, deployment status and actual published-page inspection are recorded separately in `agent-standards/output/control-surfaces-final.json` and the QR Generator checkout's `output/control-surfaces-live-chromium.json` after publication. Do not infer deployed status from a local build.

The surface guard is structural, not a visual or accessibility certification. This audit uses browser emulation, not physical devices or a screen reader. Native file-selection, print and permission dialogs belong to the browser or operating system. System controls are a deliberate forced-colors fallback, not the normal-theme design.
