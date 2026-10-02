# Public repository preparation audit

## Scope and starting state

The owner requested standardization and public publication of `VINASIG/web-design-system`. Work used the existing `main` branch. The checkout was clean and matched `origin/main` at `eade1ba182810bb3ae72e3fc6a314ce3ac0af7e2`. The repository was private at the start.

The initial content, script and Astro checks passed, the build produced eight static pages, and the existing browser regression passed 415 of 415 assertions. This baseline did not detect the narrow Vibrancy label defect found through screenshot inspection.

## Changes

- Import the reviewed agent-standards 0.1.0 `web-typescript` snapshot with 37 owned files and seven skills. Source commit and approved digests are recorded in `.vinasig/provenance.json` and [the integration record](../agents/standards.md).
- Keep the root entrypoint at 4,688 bytes, below the local 8 KiB budget. Retain the complete project guide separately and require it before implementation work.
- Add a native offline integrity gate and seven regression tests for accepted snapshots, edited payloads, altered manifests, unsafe paths, damaged instruction blocks, root overrides and preservation of owner instructions.
- Standardize canonical repository metadata, README, consuming instructions, contribution guidance, security reporting, changelog and source or asset rights. Public visibility does not approve draft design rules, grant a source license or publish an npm package.
- Pin direct dependencies, Node and npm. Pin CI actions to verified commits, preserve every existing browser assertion, add relevant failure cases and run the gates on Ubuntu and Windows. Weekly dependency updates are review proposals.
- Enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. The stronger checks exposed 33 existing diagnostics in demo data, state and array access. Resolve them through tuples, value checks, valid date handling and removal of expired optional timer properties. Do not add suppressions or weaken the compiler.
- Repair narrow Vibrancy material controls using the existing 22 rem component container query. Wide layouts keep four columns, while narrow components use two columns.

## Responsive defect evidence

| Item | Observation |
| --- | --- |
| Route and state | `/elements/`, Visual Effect Material, initial Popover selection |
| Affected widths | 320 and 360 CSS px |
| Cause | Four fixed equal tracks left material labels wider than the available button text area. |
| Before measurement | At 320 px, Sidebar text measured 38.45 px and Popover text measured 41 px in buttons only 34.66 px wide. |
| Fix | Reuse the existing narrow container query to give the controls two columns. No global clipping, content hiding or page scaling was added. |
| Regression proof | The new label containment assertion failed on the old built CSS at 320 px, producing 91 of 92 passing assertions. The final build passes it. |
| After measurement | At 320 px, buttons measured 73.31 px and every material label fit. All inspected widths from 320 to 1440 px passed label containment. |
| Desktop preservation | The 1440 px before and after specimen PNGs have identical SHA-256 digests. |

Before and after images and bounding-box records are in `output/responsive/runs/public-vibrancy-before-5b1c67b0/` and `public-vibrancy-after-5b1c67b0/`. The failing regression remains under `public-vibrancy-regression-before-5b1c67b0/`.

## Final local verification

| Check | Result |
| --- | --- |
| `npm ci --ignore-scripts` | PASS from the locked graph, 302 packages audited and zero registry-reported vulnerabilities at install time. |
| `npm run check` | PASS, including 37 owned snapshot files, catalog or assets, native script syntax and Astro diagnostics for 15 files with zero errors, warnings or hints. |
| `npm run test:standards` | PASS, seven tests with no skips. |
| Canonical standards CLI doctor | PASS for 40 structural checks. Runtime Codex discovery remains `NOT_RUN`. |
| `npm run build` | PASS, eight static pages. |
| Default browser regression | PASS, 445 of 445 assertions. |
| Touch with normal motion | PASS, 279 of 279 assertions. |
| Breakpoint and intermediate widths | PASS, 698 of 698 assertions. |
| Focused agent-page inspection | PASS at all five standard viewports for containment, local font, the integration link, visible keyboard focus and reaching the page bottom. |
| Source diff whitespace | PASS with `git diff --check`. |

Final browser runs use managed Chromium through Playwright 1.63.0 and real local Astro production previews on logged free ports. Astro permits one preview per checkout, so the final suites ran sequentially. An attempted parallel start was rejected by Astro's existing-preview guard and did not stop the active preview. Only task-owned preview processes were stopped.

## Routes, widths and states

The automated runs visited `/`, `/agents/`, `/brand/`, `/foundations/`, `/components/`, `/patterns/`, `/elements/` and `/404/`. An unknown route also returned HTTP 404 with the custom error page.

Mandatory viewports were 360 x 800, 390 x 844, 768 x 1024, 1024 x 768 and 1440 x 900. Touch with normal motion covered 320 x 900 plus 360 x 800 and 390 x 844. Additional reduced-motion widths were 480, 760, 761, 762, 959, 960, 961 and 1152 px at 900 px height.

Browser assertions covered route status, document overflow, headings, image loading, runtime errors, skip links, calendar rows and navigation, malformed local calendar state, Inbox detail and back, Save Browser, live popover resizing, long recipients, nested color panels, color keyboard adjustment, segmented columns, toggle Home and End, material labels and invalid keys, breadcrumbs, navigation drawer, modal close controls, Trash cancellation, command palette, lightbox, editor panels and the intentional parallax scroller.

Screenshots were captured throughout the regression. Visual inspection specifically opened the changed agent guidance at all five standard widths, its mobile header and page bottom, Vibrancy before and after at narrow and desktop widths, and representative 320 px calendar, toggle, material, modal and Save Browser states. Full-page captures and focused crops complement DOM, computed-style and bounding-box checks. The mobile integration code panel intentionally scrolls horizontally and was usable with keyboard input. Its scrolling did not widen the document.

## Evidence locations

All generated evidence is ignored local output, preserved under `output/responsive/runs/`.

- `public-before-5b1c67b0` retains the initial five-width regression.
- `public-release-default-5b1c67b0` contains the final five-width report and screenshots.
- `public-release-touch-5b1c67b0` contains touch and normal-motion evidence.
- `public-release-breakpoints-5b1c67b0` contains breakpoint and intermediate-width evidence.
- `public-inspection-5b1c67b0` contains focused agent-page screenshots and measurements.
- `public-vibrancy-before-5b1c67b0` and `public-vibrancy-after-5b1c67b0` contain the visual defect comparison.

## Dependency selection on 2026-10-02

Versions were queried from the official npm registry. The lockfile changes are limited to the reviewed direct updates and metadata.

| Package | Previous | Latest queried | Selected |
| --- | --- | --- | --- |
| `@lucide/astro` | 1.48.0 | 1.50.0 | 1.50.0 |
| `lucide` | 1.48.0 | 1.50.0 | 1.50.0 |
| `wrangler` | 4.146.0 | 4.147.0 | 4.147.0 |
| `astro` | 7.3.5 | 7.3.5 | 7.3.5 |
| `@astrojs/check` | 0.9.10 | 0.9.10 | 0.9.10 |
| `playwright` | 1.63.0 | 1.63.0 | 1.63.0 |
| `simple-icons` | 16.33.0 | 16.33.0 | 16.33.0 |
| `typescript` | 6.0.3 | 7.0.2 | 6.0.3 |

TypeScript 7.0.2 is outside the current `@astrojs/check` peer range of TypeScript 5 or 6. Keep 6.0.3 for this supported Astro check path. The selected Node 24.19.0 and npm 11.17.0 satisfy the checked package engine requirements. The Lucide Astro adapter accepts Astro 7. No incompatible major migration was forced.

Action tag references were independently resolved through GitHub to the pinned checkout 7.0.1, setup-node 7.0.0 and upload-artifact 7.0.1 commits recorded in the workflow.

## Publication acceptance and limits

This document records the local preparation evidence. Public visibility, anonymous access, exact remote HEAD and the published commit's two CI jobs must be checked directly through GitHub after pushing. The authoritative runs and retained browser artifacts are available under [Repository checks](https://github.com/VINASIG/web-design-system/actions/workflows/check.yml). The task completion report records those external checks.

A scoped high-signal credential scan across all 66 starting revisions found no matching tracked revision paths for the checked token and private-key patterns. This does not certify that history contains no sensitive information or replace a full security review.

Firefox, WebKit, real devices, screen readers, axe and Lighthouse were not run in this publication. Typed ESLint, Stylelint and generated HTML validation remain explicitly recorded adoption gaps in the integration document. The source syntax and framework gates must not be described as those tools having passed. No production or Cloudflare deployment was performed, and no global Codex settings were changed. Actual skill discovery by a fresh Codex session remains unverified.
