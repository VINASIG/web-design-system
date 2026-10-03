# Interface writing and control audit

## Scope and cause

The owner approved ordinary interface punctuation, sentence case, natural labels, custom list markers and fully styled open controls on 3 October 2026. The imported LANG-004, LANG-005 and WEB-008 rules apply to this change. Other draft design proposals remain draft.

The old Placement field styled a native select while its opened options depended on the operating system. Several demonstration labels also inherited uppercase styles or technical parenthetical labels. The changed source removes those patterns from authored interface copy without changing canonical catalog identifiers, code examples, provider artwork or user-controlled content.

## Source corrections

- Update component and element guidance, catalog descriptions and visible specimen text.
- Remove uppercase transforms from demonstration labels and use natural dynamic status text.
- Replace Placement with a custom, named combobox and viewport-bounded listbox. Keep form values, reset and disabled state synchronized with the original select.
- Style range tracks and thumbs in Chromium, Firefox and WebKit without replacing their native keyboard behavior.
- Explicitly focus a pointer-opened combobox. WebKit previously left focus elsewhere, so arrows and Escape could act on the page instead of the control.
- Run the rendered-interface inspector after captured demonstration states. Longer WebKit pages retain every scroll segment rather than being clipped or scaled.

The source changes are in `src/pages/components.astro`, `src/pages/elements.astro`, `src/pages/brand.astro`, `src/scripts/element-demos.ts`, `src/scripts/select-control.ts`, `src/styles/select-control.css`, `src/styles/range-control.css`, the component and element documentation, `tests/helpers/screenshot.mjs` and `tests/responsive.mjs`. The managed snapshot is updated through the installer.

## Executed verification

Source/content, snapshot integrity, script syntax and Astro diagnostics pass. Seven snapshot regression tests pass and all eight routes build.

The full browser harness passes 732 checks in each of Chromium, Firefox and WebKit at 360 x 800, 390 x 844, 768 x 1024, 1024 x 768 and 1440 x 900. It visits all eight routes and exercises changed dropdown, calendar, color and dynamic demonstration states with geometry, keyboard and axe checks. The initial WebKit run exposed the focus defect described above. The same assertions pass after the source correction. Retries, timeouts and violation baselines were not relaxed.

An additional Chromium run passes 2142 checks at 479, 480, 481, 639, 640, 641, 759, 760, 761, 958, 959, 960, 1099, 1100 and 1101 px. These are the neighbors of the actual 480, 640, 760, 959 and 1100 px CSS breakpoints.

WebKit touch with normal motion also passes 462 checks at 320, 360 and 390 px. Evidence is retained under `output/responsive/runs/interface-touch6-webkit`.

Before and after route screenshots are preserved under `output/responsive/ui-language-2026-10-03/`. Both sets of contact sheets were opened for visual review. Opened Placement and color panels were also inspected at full screenshot size. Additional harness evidence is under `output/responsive/runs/interface-final2-chromium`, `interface-final2-firefox`, `interface-final4-webkit` and `interface-breakpoints5-chromium`.

Publication and CI are verified at the committed revision separately. These browser checks do not establish physical-device or assistive-technology behavior.

## Initial-state follow-up

QR Generator's blocked-script regression exposed the original native selects before enhancement. The shared controller now reuses a disabled, styled control rendered by `SelectControl.astro`. The original select is hidden from the first HTML response, and the options container receives its listbox role when populated by the controller. Labels, values and keyboard behavior remain synchronized. No HTML validation rule is disabled.

The reused controller passes 453 WebKit checks at 360, 390 and 1440 px with touch and normal motion. Separate checks pass the disabled-script and blocked-script states in all three engines for both QR Generator and this documentation site. Open-state assertions, timeout limits and accessibility rules are retained.

The harness also adds blocked-script regressions for every tested width. A fresh 390 px WebKit touch run with normal motion passes all 163 checks, including those three new assertions. Its evidence is under `output/responsive/runs/interface-ssr13b-webkit`.
