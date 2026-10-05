# Documentation layout and section links

## Scope and baseline

The owner reported inconsistent header, documentation sidebar and footer geometry on the published site and requested shareable heading links on `/elements/`. At a 1440px viewport, the original header/footer occupied x176 through x1264 while the documentation grid occupied the entire viewport from x0 through x1440. The sidebar also used a fixed graphite background in both themes and a forced viewport height.

## Implementation

The three layout regions now use the same centered 80rem content band, including the sidebar. The shared `site-chrome.css`, original artwork and footer destinations remain intact. The documentation navigation uses semantic theme colors, a content-sized sticky sidebar with a 24px top inset, and its existing wrapping navigation below 960px. Main content no longer adds a second horizontal gutter. Footer separation remains defined by the shared chrome source.

Narrow navigation columns use a minimum based on text size. Enlarged text can switch to one column rather than retaining two cramped columns. Enlarged-text inspection waits for the rendered style/layout update and explicitly confirms a computed 32px root/body font against the ordinary 16px baseline. A requested size without confirmed computed values is insufficient evidence.

All 81 entry headings, nine category headings and both platform headings are native fragment links. Entry IDs remain catalog identifiers in both languages. Targets have a 24px scroll inset and accept fragment focus without joining the ordinary Tab order. Entry targets receive a visible theme-aware border. No navigation dependency or custom scroll handler was added. The existing language switch preserves the fragment with JavaScript. Direct links and heading activation also work without it.

Project instructions and both copies of the shared chrome contract now require reviewing the complete composed layout at the top and bottom of long pages. The catalog guide records stable link maintenance.

## Observed evidence before publication

- PASS `npm run check` with Node 24.21.0 and npm 11.19.0. Astro reported zero errors, warnings and hints. Catalog, asset, standards, syntax and licensing checks passed.
- PASS `npm run build`, including the built licensing check. All 16 localized pages built.
- PASS browser inspection of all 16 routes at English desktop 1440px/light and Vietnamese 390px/dark. The header, grid and footer had identical horizontal bounds and no page overflow. At 1440px the band occupied x80 through x1360. At 390px it occupied x16 through x374.
- PASS additional rendered layout observations at 320, 768, 959, 960 and 1024px, including both themes, header/footer screenshots and breakpoint neighbors. Screenshots were opened and reviewed.
- PASS Chromium and WebKit interaction observations. Each of the 81 entry links had a unique matching target. Pointer and Enter activation updated fragments. Reload and direct opening arrived with approximately 24px top spacing. Category/platform heading links worked. Switching to Vietnamese retained the entry fragment. Fragment targets received keyboard focus. A 320px view with 200 percent text did not produce page overflow.
- PASS JavaScript-disabled direct entry navigation in Chromium and WebKit at 390px/dark.
- NOT_RUN local Firefox visual inspection. The installed Firefox executable failed to launch with `spawn UNKNOWN`. The repository's existing publication workflow retains its Firefox, Chromium and WebKit jobs on Linux and Windows.
- NOT_RUN physical phone and assistive-technology sessions. Browser observations do not establish physical-device or complete accessibility conformance.

Local screenshots and DOM observations are under ignored `output/docs-layout-2026-10-05/`. No local regression suite was added or run for this fix. The existing publication workflow runs automatically after the authorized push. Its results and the deployed revision must be checked separately before claiming publication.
