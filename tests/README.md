# Repository checks

Use the Node version in `.node-version` and install the locked dependencies with `npm ci --ignore-scripts`.

## Source and content

Run `npm run check` to validate the pinned standards snapshot, element catalog, rendered specimen coverage, icon registry, required local assets, Node script syntax and Astro TypeScript diagnostics. The checks use the existing source files as their input.

Run `npm run test:standards` when changing the snapshot or integrity checker. Native Node tests use isolated copies under ignored `output/publication/standards-tests/` to prove that changed payloads, altered manifests, unsafe paths, instruction damage and root overrides fail. They never modify the real installed snapshot. These tests do not verify discovery by a running Codex session.

## Responsive regression

Every route and viewport also runs axe checks for WCAG A and AA through 2.2. The gate retains the report for invalid roles, names, required children, contrast, target size and focusable scrolling. No violation baseline or rule exclusion is accepted. Automated scans supplement the geometry, interaction and visual checks and do not certify WCAG conformance.

```sh
npx playwright install chromium
npm run build
npm test
```

The test starts an Astro production preview on a free local port and stops that process when it finishes. It leaves existing development servers running. To test a server you already started, set `RESPONSIVE_URL` to its URL.

The preview includes Astro's configured deployment base. For the canonical GitHub Pages custom domain this is `/`. Internal navigation, favicon paths, image downloads, provider marks and the local font must remain inside that base. `node --test tests/paths.test.ts` checks root and project URL resolution without a browser.

Each run checks all eight current static routes at 360 x 800, 390 x 844, 768 x 1024, 1024 x 768 and 1440 x 900. It also checks that an unknown URL returns HTTP 404 and the custom error page. It records page overflow, headings, image loading and runtime errors, then exercises the repaired states on `/elements/`. These include the Inbox, calendar, Save Browser, long recipients, color panels, breadcrumbs, Columns view, navigation drawer and modal close controls. The test cancels the Trash alert.

Regression cases also verify valid calendar month navigation, malformed calendar state, Home and End selection in a toggle group, readable material labels and rejection of inherited object keys as material names. Malformed state is injected only into local demonstration DOM and restored afterward.

Screenshots, the preview log and assertion results are saved under `output/responsive/runs/<timestamp>/`. A run name can be supplied with `npm run test:responsive -- <name>`. Use a fresh name to retain evidence from previous runs.

The long element library can exceed WebKit's 32767 px screenshot limit. The harness preserves the requested viewport and captures every scroll segment as `--part-NNN.png`. It does not hide content, scale the page or omit assertions. Firefox uses touch input with a narrow viewport because Playwright does not support its `isMobile` flag. Emulation does not establish behavior on a physical device.

The default run uses managed Chromium with reduced motion. Optional environment variables are:

| Variable             | Purpose                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RESPONSIVE_URL`     | Use an existing local server instead of starting a production preview.                                                                                             |
| `RESPONSIVE_WIDTHS`  | Supply comma-separated widths, such as `320,359,360,391,767,769,1023,1025`. The five standard widths use their standard heights. Other widths use a height of 900. |
| `RESPONSIVE_BROWSER` | Use a Playwright browser channel installed on the machine, such as `chrome`.                                                                                       |
| `RESPONSIVE_ENGINE`  | Select managed `chromium`, `firefox` or `webkit`. The default is Chromium.                                                                                         |
| `RESPONSIVE_MOTION`  | Set to `normal` to check transitions with motion enabled.                                                                                                          |
| `RESPONSIVE_TOUCH`   | Set to `true` to use touch input and mobile emulation below 600 px.                                                                                                |

GitHub Actions runs all three engines on Ubuntu and Windows. Each job runs the same source and standards regression checks, builds the site and runs both the default regression and touch with normal motion at 320, 360 and 390 px. The matrix also checks base-aware keyboard navigation, font loading and favicon requests. Pages deployment depends on the entire matrix. Artifacts remain available for 14 days. Visual inspection remains necessary when changing UI. Passing assertions does not prove that every visual state or browser is correct.

## Bilingual regression

Read docs/LOCALIZATION.md. Language and appearance regression tests run through the existing browser command. They cover both built locales, native navigation without scripts, metadata, localized guidance, keyboard controls, theme persistence and blocked storage. Authored textarea guidance is translated while its content remains literal. The original core and responsive assertions remain enabled.

## Dropdown indicator regression

`npm run test:controls` checks the actual shared dropdown on English `/components/` and Vietnamese `/vi/components/`. The imported `inspectControlIndicators` requires a 16 CSS px inner trailing inset, a 12 CSS px selected-value gap, declared SVG dimensions and unclipped markup. Expected markers are asserted separately so missing controls cannot produce an empty pass.

The focused matrix covers both themes at 320, 360, 390, 759, 760, 761, 768, 1024 and 1440 px. It opens the popup, checks its bounds and restores keyboard focus with Escape. At 320 px it also uses a long selected value with 200% text and verifies disabled initial HTML without scripts. Screenshots remain under `output/responsive/control-indicators/<engine>/`. Open them before accepting a change.

The default focused command runs Chromium, Firefox and WebKit, with 36 locale/theme/viewport cases per engine. `RESPONSIVE_ENGINE` selects the matching engine in the existing CI matrix, while `BROWSER_ENGINES` can explicitly select a comma-separated list for this command. `npm test` includes this guard after the responsive and bilingual suites. Compact platform-reference specimens retain their documented metrics.
