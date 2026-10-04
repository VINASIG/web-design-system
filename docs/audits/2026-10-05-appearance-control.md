# Appearance control review

Reviewed on 5 October 2026 at the owner's request.

## Approved change

The owner selected the Lucide Sun and Moon appearance button already used by TOTP Generator and QR Scanner for all VINASIG websites. The shared Icon component now exposes these two names and accepts an optional size while preserving its existing 24 CSS px default. Appearance controls use 20 CSS px glyphs inside a target of at least 44 CSS px.

Light mode offers Moon for switching to dark mode. Dark mode offers Sun for switching to light mode. The existing accessible action name, pressed state, keyboard focus, theme persistence, language link and transparent header artwork remain intact. The component documentation, published English guidance and Vietnamese translation describe the same rule.

## Verification

- PASS source, content, script, Astro type and license checks, and the static build.
- PASS all seven standards integrity tests.
- PASS `npm test`. The responsive suite reported 804 checks without failures. Bilingual navigation and appearance checks passed in Chromium, Firefox and WebKit. The dropdown suite passed 108 cases. The control-surface suite passed 12 cases and eight forced-color states.
- PASS an additional Chromium touch run with normal motion at 320, 360 and 390 CSS px. It reported 506 checks without failures.
- PASS the new appearance regression assertions. They require two decorative SVGs, the correct visible state, a target of at least 44 CSS px and an actual 20 by 20 CSS px glyph before and after toggling, including blocked preference storage.
- PASS browser inspection of both homepage locales in light and dark mode at 360 by 800, 390 by 844, 768 by 1024, 1024 by 768 and 1440 by 900. Before and after screenshots were opened and compared. The measured target and glyph dimensions matched the rule and there was no page overflow or runtime error.

Machine reports and screenshots are retained under ignored `output/`. The review used desktop browser emulation and does not establish behavior on a physical device. Publication is gated by the repository's existing GitHub Actions matrix.
