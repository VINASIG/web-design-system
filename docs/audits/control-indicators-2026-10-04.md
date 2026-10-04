# Dropdown indicator spacing audit

Reviewed on 4 October 2026 after the owner reported crowded arrows in QR Generator, which uses this project's shared dropdown pattern.

## Implementation and documented rule

The shared ordinary dropdown had a 12 CSS px trailing inset. It now uses the existing spacing tokens for a 16 CSS px logical inline-end inset and a 12 CSS px selected-value gap. Initial component markup and the enhanced controller both expose the imported inspector's value and indicator markers. The declared 20 by 20 px SVG dimensions remain enforced.

The component guide, UI quality workflow, standards integration record and English/Vietnamese Components pages describe the same measured rule. WEB-008 and the responsive skill come from reviewed agent-standards source `59c4b39cfd5f6aa90050da529af1d9894cfe41fb`. The offline import preserved owner instructions and passed doctor and provenance checks. Compact platform-reference specimens retain their documented metrics.

## Reflow defects found during regression

The long-selected-value fixture at 320 px and 200% text exposed page-wide overflow from the Components heading, callout children, buttons and iconography labels. The source fix adds wrapping and appropriate flex minimum/maximum constraints. Nested card, callout and mobile page padding are bounded at their existing 16 px-root values, so enlarged text retains usable content width. The normal-size padding values are unchanged.

The final focused captures in both locales/themes show a 320 px document in a 320 px viewport. The intentional code panel retains its own horizontal scrolling. No page-wide clipping or content hiding was added.

## Observed local evidence

The first spacing revision passed the following gates. The final published-page follow-up has separate verification below.

- Source checks passed standards integrity, catalog/content coverage, script syntax, Astro diagnostics with zero errors/warnings and license validation. The production build generated all 16 localized routes and passed built legal checks.
- Snapshot regression passed 7 cases and localization unit regression passed 5 cases.
- Chromium, Firefox and WebKit each passed the full 794-check responsive suite, bilingual browser suite and 36-case focused dropdown matrix. All 108 focused locale/theme/viewport cases passed.

The full responsive suite visits the eight route layouts and their custom error behavior at the five standard viewports. Bilingual regression visits the equivalent localized routes. The new focused matrix checks English `/components/` and Vietnamese `/vi/components/`, both themes, at widths 320, 360, 390, 759, 760, 761, 768, 1024 and 1440 px. It tests closed/open options, bounds, Escape focus restoration, long selected values at 200% text and disabled initial markup without scripts. `npm test` includes this regression guard.

## Screenshots and boundaries

Immutable initial spacing captures and separate after captures are retained in the sibling qr-generator checkout under ignored `output/responsive/control-inset-2026-10-04/`. All locale/theme trigger contact sheets were opened at a useful scale. The initial enlarged-text overflow and final reflow captures are retained there separately. The final dropdown, callout, button, iconography and code captures were also opened.

Full responsive screenshots/reports are under this checkout's `output/responsive/runs/`. Bilingual evidence is under `output/responsive/localization/`, and focused screenshots are under `output/responsive/control-indicators/<engine>/`. Current-commit CI and Pages deployment are verified separately before delivery. Physical devices, screen readers, field performance and runtime Codex skill discovery remain NOT_RUN.

## Published-page visual follow-up

The first public-page screenshot review found that wrapping inherited from `.docs-main` split the desktop Accessibility term into two lines. The new desktop regression reproduced the defect with two text rectangles instead of one. Heading reflow is now scoped to `h1`, while the explicit callout, button, iconography and selected-value fixes retain their own constraints. The normal desktop term is checked independently of the 320 px enlarged-text cases.

The follow-up passed source checks, the 7 snapshot unit cases and the 16-route production build. The complete default browser command passed 794 Chromium responsive checks, bilingual flows on Chromium/Firefox/WebKit and all 108 focused cases on those three engines. The desktop term stays on one line in both themes, while 320 px enlarged-text reflow remains within the viewport. Final desktop and enlarged-text screenshots were opened.

The initial published screenshot is retained in the sibling QR checkout as `before/design-en-dark-1440x900-typography-followup.png`. Final public captures are accepted only after the follow-up checks and deployment complete.
