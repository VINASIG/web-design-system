# Responsive audit on 2 October 2026

This audit used the local Astro application in Chrome through Playwright. It reviewed the supplied clipping and alignment issues along with the shared layouts and the element library. The result is a draft implementation review, not an accessibility certification.

## Corrections

Twenty findings were recorded before their correction. Changes address their layout causes in the existing components and design tokens.

| Area | Correction |
| --- | --- |
| Shared headings | Query the actual content width after the sidebar takes space. |
| Typography labels and skip link | Give labels usable width and clip the unfocused skip link while preserving its keyboard state. |
| Calendar | Use seven columns on each semantic row instead of duplicating columns in its parent. |
| Inbox | Remove selector specificity that prevented the existing mobile list and detail layout. |
| Save Panel | Allow the header to wrap, give folders usable width and stack the browser at its existing narrow breakpoint. |
| Timeline, Share Card and tags | Let text wrap and determine content height within flexible tracks. |
| Token Field | Remove implicit minimum widths and allow long recipients and feedback to wrap. |
| Overlay comparison and menu samples | Restore narrow layouts and constrain menu panels to their actual containing sample. |
| macOS Popover and Color Well | Reserve measured space for open panels and update it on resize. |
| Color picker markers | Keep the whole circular marker within the rounded surface at extreme values. |
| Breadcrumbs | Wrap expanded ancestors, use an array for membership checks and restrict motion to positions that remain on the same line. |
| Segmented Control and Columns | Stack narrow icon labels and retain readable columns with an internal keyboard-accessible scroller. |

The responsive repairs are in `src/pages/elements.astro`, `src/scripts/element-demos.ts` and `src/styles/global.css`. Existing icon, control and animation work remains in the same repository.

## Observed coverage

All eight routes were opened, scrolled to the end, captured and visually inspected at 360 x 800, 390 x 844, 768 x 1024, 1024 x 768 and 1440 x 900.

The routes were `/`, `/agents/`, `/brand/`, `/foundations/`, `/components/`, `/patterns/`, `/elements/` and `/404/`.

On `/elements/`, the review covered all 81 default specimens and 44 state cases at each mandatory viewport. States included menus, modal variants, tabs, accordion, local form errors, long search and recipients, Calendar changes, Inbox detail and empty search, Save Browser and choice menus, rating limits, Dock double digits, expanded Editor Colors Panel, Delete Sheet and vibrancy. Six viewport overlay cases were reviewed separately to check containment and reachable close controls.

CSS media thresholds were checked immediately before and after their widths. The extra review also included 320, 450, 700, 900 and 1280 px and actual content widths near container transitions. This covered 43 additional widths and 190 route and width combinations. Extra visual review focused on shared navigation, headings and the affected specimens.

The final audit assertions passed in three runs:

| Run | Result |
| --- | --- |
| Five mandatory viewports | 245 of 245 |
| Seventeen extra widths | 834 of 834 |
| Touch and normal motion at 360 and 390 px | 106 of 106 |

The eight-page static build passed. Favicon exports at 16, 32 and 48 px resolved successfully.

## Evidence and regression

Local before and after screenshots, findings and geometry reports remain under ignored `output/responsive/`. Original before images were retained. The detailed local report is `output/responsive/reports/report.md`, and the defect log is `output/responsive/reports/defects.md`.

The reusable regression now lives in `tests/responsive.mjs`. It checks all current routes, the five mandatory viewports and repaired control states against a production preview. It produces a new timestamped report and screenshots for each run. See `tests/README.md` for commands and optional breakpoint, motion and touch checks. GitHub Actions publishes each CI run's browser artifacts for review.

## Repository validation after normalization

The following checks were run again against the final source and locked dependencies:

- `npm ci` completed successfully.
- `npm run check` passed catalog, icon, asset and script checks. Astro reported zero errors, warnings and hints after fixing twelve existing TypeScript diagnostics and removing one unused helper.
- `npm run build` generated eight static pages.
- The portable regression passed 415 of 415 assertions at the five mandatory viewports against a production preview.
- Touch with normal motion passed 261 of 261 assertions at 320, 360 and 390 px.
- `npm audit` reported zero vulnerabilities after updating Wrangler within major version 4.

The production preview correctly returned HTTP 404 and the custom page for an unknown URL. Requesting its explicit static 404 resource returned HTTP 200. Screenshots of Color Well, long tokens, expanded Editor Colors Panel and Columns were reviewed again at the five standard viewports. These final runs used Playwright's managed Chromium on Windows.

## Limits

No unresolved defect remains among the recorded findings and exercised flows. Chrome emulation was used. Physical devices, Safari, Firefox and formal assistive technology sessions were not tested. Intentional table, code and file-browser scrolling remains. Passing a build or regression assertions does not replace visual inspection, and the review does not cover every possible content value or state.
