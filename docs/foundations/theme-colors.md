# Shared neutral appearance

The owner approved Radix Gray interface neutrals across VINASIG websites on 8 October 2026. This decision applies to page backgrounds, panels, fields, headings and supporting text. Identity colors and the archived palette remain separate reference primitives.

The implementation source is src/styles/tokens.css and src/styles/preferences.css. Consumer projects keep reviewed local copies, including the system-preference fallback. There is no CDN request, runtime color package or added storage. Existing language and appearance preferences remain shared.

| Interface role | Light | Dark |
| --- | --- | --- |
| Canvas | #F9F9F9 | #111111 |
| Surface | #FCFCFC | #191919 |
| Muted surface | #F0F0F0 | #222222 |
| Hover surface | #E8E8E8 | #2A2A2A |
| Text and headings | #202020 | #EEEEEE |
| Supporting text | #646464 | #B4B4B4 |
| Decorative divider | #CECECE | #484848 |
| Required control boundary | #838383 | #7B7B7B |
| Progress and range indicator | #17375F | #DCE7F2 |

The neutral values follow the sRGB [Radix Gray light](https://github.com/radix-ui/colors/blob/main/src/light.ts) and [dark](https://github.com/radix-ui/colors/blob/main/src/dark.ts) scales inspected on 8 October 2026. The two indicator colors are existing derived VINASIG blues. Values are stored locally and never downloaded during a build.

Use the strong boundary role for fields and controls whose outline identifies them. Decorative dividers may use the quieter border role. Do not assume a palette step alone satisfies contrast. A dark primary button may keep a dark blue fill with white text, while a progress indicator needs a brighter color against its depleted track. These are different semantic roles.

Ordinary text requires at least 4.5:1. Meaningful icons, focus indicators, control boundaries and state cues require at least 3:1 against their actual adjacent colors. Evaluate alpha compositing, placeholders, hover and selection rather than only opaque token pairs. Do not round a failing result up to the threshold. Disabled controls and decorative artwork have different WCAG requirements.

`npm run test:theme` checks the rendered CSS cascade, both locales, system defaults and explicit overrides against the opposite system theme with JavaScript disabled. It measures text on all four neutral surfaces, focus and field boundaries, progress contrast and semantic message pairs. Existing browser tests cover actual interactions, accessibility, forced colors and responsive layouts. These checks are evidence for the inspected states and do not constitute an independent WCAG certification.

Keep original logos, font bytes, palette exports and generated user images unchanged. QR geometry, downloadable artwork and platform-reference specimens retain their own intended colors. New interface CSS must use the shared semantic roles rather than reintroducing warm backgrounds or hardcoded neutral text.

Primary requirements are [WCAG 2.2 text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Radix is a practical palette source, not a W3C standard or a guarantee of accessibility.
