# Specimen canvas correction

## Scope and acceptance

The owner reported rectangular white backplates behind the truncation, empty-state, multi-select, sign-in, date-picker and resize-handle examples on the Vietnamese element catalog. Correct that shared surface cause across all 81 examples. Preserve the actual component surfaces, reference colors, interactions and native heading links.

## Baseline and cause

The published `.ui-sample` rule painted its entire width-limited layout wrapper with `--color-surface`. The outer `.element-preview` used the documentation canvas, while only the inner wrapper received the reference palette. In the light theme this created a square white rectangle within the neutral preview. In the dark theme it created a white strip against the dark stage. The previous layout review missed this defect inside the examples.

At 1440px the sign-in preview had a 993.21875px stage and a 704px white wrapper. The stage was rgb(247, 246, 244) in light mode and rgb(31, 28, 29) in dark mode. The wrapper was white in both. Captured baseline screenshots match the owner's report.

## Correction

Apply the existing light reference palette to the complete inline preview and enlarged demo stage, as well as the sample. Keep `.ui-sample` transparent. The stage owns one uninterrupted neutral canvas. Cards, forms, menus and other actual components retain their own authored surfaces. The documentation shell still follows its selected theme.

The project guide and catalog guide now state which layer owns the reference canvas and require inspection of wrapper edges, padding, small controls and opened panels in both themes. No assets, dependencies, control markup, interaction handlers, heading fragments or shared chrome styles changed.

## Local evidence

- PASS `npm run check` with pinned Node 24.21.0 and npm 11.19.0. Astro reported zero errors, warnings and hints. Catalog, standards, assets, syntax and license checks passed.
- PASS `npm run build`. All 16 pages and the built licensing check passed.
- PASS Chromium and WebKit rendered observations on the element catalog at 320, 390, 768, 959, 960, 1024 and 1440px in both themes. All 2,268 observed sample instances used a transparent wrapper and rgb(247, 246, 244) stage. Normal-size pages had no horizontal page overflow or JavaScript errors.
- PASS opened multi-select and calendar inspection. The calendar trigger reported expanded and its actual `.sample-calendar` panel was visible in both local engines. Screenshots of the affected examples were opened and reviewed.
- PASS existing heading fragments and script-unavailable sample surfaces in Chromium and WebKit. The transparent presentation comes from CSS and does not require enhancement.
- NOT_RUN local Firefox visual inspection. Its managed executable failed with `spawn UNKNOWN`. The unchanged publication workflow retains Firefox, Chromium and WebKit on Linux and Windows.
- LIMITATION a separate 320px inspection with a confirmed 32px root font found 439px document scroll width. The same 439px width exists on the published baseline before this surface correction. This record does not claim an enlarged-text catalog reflow pass. Correcting the pre-existing specimen geometry is outside this bounded background change.
- NOT_RUN physical-device and screen-reader sessions. These observations are not a complete accessibility review.

Ignored screenshots and raw observations live under `output/specimen-background-2026-10-05/`. An initial script-unavailable element screenshot did not settle and timed out. The replacement viewport capture completed in both engines. No local regression suite was added or run. Publication uses the existing automatic workflow. Confirm the exact CI revision and live stylesheet separately before reporting deployment.
