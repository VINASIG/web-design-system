# Shared palette adoption on 8 October 2026

The owner requested identical palette names and values across Brand Assets and Web Design System, without formatting identifiers or game-derived color names. Brand Assets owns the canonical JSON. The reviewed copy is pinned in PALETTE_SOURCE.json.

The JSON, generated palette CSS, Foundations swatches and English/Vietnamese names now use the same record. There are 16 base colors, 30 deep tones and 45 distinct Hex values. The five identity anchors and all semantic UI shades remain unchanged. Two brighter optional bases from the earlier draft are outside the shared selected palette. All reviewed deep tones are available.

The build uses local data only. The source check rejects a changed hash, generated CSS drift, incorrect translated names, altered anchors, missing tones and malformed values. Tests retain negative fixtures. Historical audits describe the earlier proposal rather than current palette naming. Original artwork and font notices are preserved.

Verify source, build, existing browser suites and actual localized Foundations pages before publication. Passing local fixtures alone does not prove deployment. Publish only after the existing complete CI matrix passes.

Local source and build checks passed with zero Astro errors, warnings or hints. The three data regression cases passed. The existing browser command passed shared chrome, responsive, localization, dropdown and control-surface checks. The focused palette matrix passed 108 cases across Chromium, Firefox and WebKit, with both locales, themes, breakpoint neighbors and enlarged text.

Opening the 200 percent text capture exposed clipping inside the previous fixed-column card despite a passing page-overflow assertion. Palette cards now wrap according to available content width. The focused regression measures text and Hex bounds inside every enlarged card and rejects internal clipping. After the change, the same three-engine palette matrix passed and the new enlarged captures were opened. Public deployment and exact revision verification remain separate gates.
