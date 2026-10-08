# Destructive action review on 8 October 2026

The owner reported that deletion and session clearing used ordinary blue action styling. This review covers all fourteen VINASIG web repositories present in the ecosystem inventory. The reviewed controls use explicit semantic markers and the same destructive action stylesheet. Brand artwork, shared chrome, neutral surfaces and preference synchronization remain governed by their existing source pins.

## Scope and classification

The inventory is based on the effect of each handler, including controls that are initially hidden or disabled. Six tools used blue destructive controls, QR Scanner used a neutral control, and Metadata Cleaner already used red. There are nine product controls across eight tools.

| Repository           | Data-discarding controls                                            | Baseline       | Delivery                             |
| -------------------- | ------------------------------------------------------------------- | -------------- | ------------------------------------ |
| totp-generator       | Clear key, codes and active session                                 | Blue           | Red session clear                    |
| bmi-calculator       | Clear height, weight and result                                     | Blue           | Red session clear                    |
| nvqs-bmi-calculator  | Clear measurements and result                                       | Blue           | Red session clear                    |
| metadata-cleaner     | Clear loaded files and generated outputs                            | Red            | Shared red implementation            |
| metadata-editor      | Clear files and session, discard edits by restoring original values | Blue           | Two red actions                      |
| metadata-reader      | Clear files and report                                              | Blue           | Red session clear                    |
| qr-generator         | Clear input and generated QR                                        | Blue           | Red session clear                    |
| qr-scanner           | Clear image, scan results and session                               | Neutral        | Red session clear                    |
| password-generator   | No user-facing delete or clear action                               | Not applicable | Agent procedure adoption             |
| favicon-forge        | No action discards user inputs                                      | Not applicable | Agent procedure adoption             |
| unphar               | No action discards user inputs                                      | Not applicable | Agent procedure adoption             |
| vinasig              | Search and filter clearing only                                     | Not applicable | Agent procedure adoption             |
| vinasig-brand-assets | No data-discarding action                                           | Not applicable | Agent procedure adoption             |
| web-design-system    | One component and eight element actions                             | Mixed          | Reviewed red specimens and procedure |

Search query clearing, filters, cancellation, restoring demonstration items, mute and archive remain ordinary actions. Metadata cleaning creates a new downloadable copy and preserves the uploaded original. It is not a destructive action solely because its label mentions removal. Password generation replaces the current output through an explicitly requested generation flow and does not require an invented delete control. No new confirmation dialog is introduced for local session clearing.

The element inventory includes both the trigger and confirmation for Empty Trash, the overflow-menu Delete command, the modal destructive action, clearing recent search history, Move to Trash in the context menu, and the trigger and confirmation for the delete sheet. The components page includes Delete draft. The actual opened native alert, menus and sheet are tested, including their keyboard state.

## Shared implementation and prevention

`src/styles/destructive-actions.css` is the reviewed source. Consumers retain byte-identical copies and record this file's SHA-256 and the design source revision in `docs/destructive-actions.json`. Their browser regression verifies the copy against that pin.

The outlined variant uses readable semantic red text, icon, border and focus. The filled confirmation uses white text on the approved red background. Hover and active states retain the red meaning. Disabled controls remain recognizably unavailable. Forced colors use system colors with explicit action labels and visible focus. Red is accompanied by the existing localized action name and icon rather than being the only information about the effect.

WEB-010 in VINASIG agent-standards is the single procedure. It requires an effect-based inventory, explicit `data-destructive-action` markers, the reviewed red variants, before and after image review, actual discard behavior, and all relevant interaction states. The generated AGENTS entrypoint and both web profiles route to this contract. Managed snapshots are updated through the verified installer. Owner instructions remain byte-identical outside its managed block. Each repository records source and bundle provenance. The structural doctor confirms installed integrity. It does not certify that an agent read every document in a new session.

The reusable `inspectDestructiveActions` checks exact declared counts, missing or extra markers, native semantics, accessible names, reviewed red roles, enabled opacity and unrounded contrast. Text requires 4.5:1. Icons, meaningful boundaries and visible keyboard focus require 3:1. A deliberately blue destructive control must fail the regression. Diagnostics contain selectors and rule descriptions rather than user inputs or generated secrets.

The inspector's color probes are isolated from the action's layout. Cross-engine testing exposed interference from host transitions, important child styles and flex hover geometry. The corrected inspector resolves the scoped palette outside the button and has dedicated regressions. Thresholds and semantic red requirements remain unchanged.

Forced-colors checks also emulate the actual light or dark color scheme. Firefox's translucent Highlight focus color and WebKit's white ButtonText on a gray ButtonFace did not meet the same contrast requirements. The shared fallback therefore uses the CanvasText and Canvas system pair for text, boundaries and focus, with an inverted pair on hover and active. This respects the user's high-contrast palette without preserving an unreadable custom red.

## Evidence and acceptance

Canonical Agent Standards source is [567d839f6fdb983582e1f0ed4c33678799cc6fe8](https://github.com/VINASIG/agent-standards/commit/567d839f6fdb983582e1f0ed4c33678799cc6fe8). Its [source checks](https://github.com/VINASIG/agent-standards/actions/runs/37765546323) and [web fixture checks](https://github.com/VINASIG/agent-standards/actions/runs/37765546329) both passed on Linux and Windows.

The strengthened system-palette fixtures at [cb3161cb04b3cdab15f007d0c9e201a71a40833d](https://github.com/VINASIG/agent-standards/commit/cb3161cb04b3cdab15f007d0c9e201a71a40833d) also passed the [source and installer job](https://github.com/VINASIG/agent-standards/actions/runs/37774508205) and [web matrix](https://github.com/VINASIG/agent-standards/actions/runs/37774508200). The installed runtime payload remains the approved 567d839 snapshot. Fixture-only improvements do not change that payload.

The final revisions, CI runs, deployment checks and live results are recorded in the [ecosystem publication receipt](https://github.com/VINASIG/agent-standards/blob/main/docs/audits/destructive-actions-2026-10-08.md).

Synthetic inputs are used throughout. The TOTP fixture is a public test key. Metadata fixtures are generated test images. Reports and screenshots remain in ignored output directories and CI artifacts rather than publishing user files.

| Evidence                                                          | Recorded evidence                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| Baseline product behavior and opened before images                | PASS, 32 locale and theme combinations                             |
| Local product source, unit and production builds                  | PASS for all eight affected tools                                  |
| Local Chromium product interactions and opened after images       | PASS, 32 locale and theme combinations                             |
| Canonical installer unit tests and browser fixtures               | PASS, 20 unit tests and 204 browser cases on each operating system |
| Persistent product regressions in Chromium, Firefox and WebKit    | See the final source CI and publication receipt                    |
| Design specimens in both languages, themes and widths             | PASS locally, 24 combinations across all three engines             |
| Managed integrity in all fourteen web repositories                | PASS before publication, rechecked after final adoption            |
| Exact revision CI, deployment and live behavior                   | See the exact revision and live results in the publication receipt |
| Physical devices, screen readers and independent human evaluation | NOT_RUN                                                            |

The design regression uses 390 and 1440 CSS pixel widths in both languages and themes across Chromium, Firefox and WebKit. Each action is checked in default, hover, active, keyboard focus and forced colors states. It confirms empty-trash and clear-recent-history effects. Product regressions additionally check initial disabled states where the product provides them and actual clear or discard outcomes. Existing responsive, localization, controls, chrome and performance gates continue to run as applicable.

The full browser gate exposed a separate Foundations issue at 320 CSS pixels with 200% text. Fixed spacing and type columns squeezed content, and the brand-role swatches did not reflow their descriptions. The repaired layouts wrap or stack at the available container size. All 108 palette locale/theme/viewport cases pass, including enlarged text in every engine. No horizontal-overflow or contrast threshold was removed. Enlarged geometry and the actual color, type and spacing specimens are retained with the browser artifacts.

Native keyboard checks preserve browser focus behavior. In a modal, Tab at the final action can leave the same element active while traversing browser chrome. The test follows actual native Tab navigation back to the action instead of assuming one fixed Tab/Shift+Tab pair. Menu actions are reached through the menu's End key. No focus class, tabindex override or forced focus styling is injected to satisfy the assertion. The normal-motion mobile suite also uses its existing geometry-settled native tap for the scrolled editor panel close button, instead of a mouse click during root scrolling. Closing still has to clear the open/visible flags and make the panel inert and aria-hidden. No second tap or click retry is used.

## Sources and authority

[W3C use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) supports redundant cues. [GOV.UK warning button guidance](https://design-system.service.gov.uk/components/button/#warning-buttons) supports selective styling for destructive effects. Neither source mandates red for every button containing the word clear. The owner explicitly requested red for VINASIG deletion, session clearing and discarding unsaved edits. That decision is now represented in one canonical procedure and executable regressions.
