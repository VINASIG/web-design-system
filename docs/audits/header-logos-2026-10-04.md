# Header logo audit

Reviewed on 4 October 2026 under the owner's organization-wide request. The interface-language and custom-control work was completed first and has its own audit record.

## Cause and implementation

The sidebar reconstructed the VINASIG wordmark with live text. The approved original transparent Reversed export was already available.

The sidebar now uses the unchanged Reversed SVG on its consistently dark surface, for both system preferences. Product text remains outside the logo artwork.

The application entry is `src/layouts/DocsLayout.astro`. Existing asset digests remain unchanged. The approved horizontal artwork has a 540 by 140 viewBox. Integrity checks preserve the original bytes and internal white geometry. Browser checks compare the declared and rendered ratio against that reviewed viewBox instead of inferring it from browser-rounded natural dimensions.

## Standards adoption

The managed standards snapshot is pinned to `7c699d1dccd05c1dd2c4f0de4bb3abae23174ccd`. Installer diff, dry run, update and doctor completed. Project-owned AGENTS text outside the managed block was preserved byte for byte. The shared WEB001 rule records the owner-approved header requirement. Other draft brand recommendations retain their draft status.

## Local browser verification

Routes reviewed are `/`, `foundations/`, `components/`, `elements/`, `patterns/`, `agents/`, `brand/`, `404.html`. Chromium, Firefox and WebKit each visited these routes at 360 by 800, 390 by 844, 768 by 1024, 1024 by 768 and 1440 by 900 with both light and dark system preferences. All 240 route, viewport, preference and engine combinations passed rendered-header, copy, overflow and runtime checks. Pages were scrolled to the bottom. Logo focus and hover were inspected after the initial capture.

Chromium captures are full-page images. Firefox and WebKit captures show the viewport after full-page scrolling. Chromium contact sheets for every route were opened and reviewed, together with Firefox and WebKit header sheets for the home page at 390 and 1440 px in both preferences. Representative full-page captures were also opened. Screenshots are local evidence, not a claim of physical-device or assistive-technology testing.

The existing screenshot helper now asserts the shared header check during route and control-state captures. The responsive suite retains its accessibility, keyboard, touch, motion and custom-control assertions.

## Evidence and limits

Immutable initial header screenshots are under ignored `output/responsive/header-logos-2026-10-04/before/chromium/`. Successful after captures are under `output/responsive/header-logos-2026-10-04/after-verified/`, with a folder for each engine. Earlier diagnostic runs are retained separately and are not the accepted result. The interface-language audit has separate before and after screenshots.

This is a local verification record. Current-head CI and GitHub Pages publication are verified separately before task completion. No font, business calculation, generated output, private data or original logo artwork was changed by the header work.

## Documentation consistency follow-up

The final instruction review found an older native-popup exception in `docs/agents/ui-quality.md`, despite its opening statement already adopting WEB-008. The implementation section now requires a reviewed custom dropdown and explains the native select's hidden form-state role. It also applies the rule to calendars, color choosers, slider tracks and thumbs, and meaningful disabled initial HTML. The interface implementation and original artwork are unchanged by this documentation correction.

## Additional completed gates

The final adopted snapshot passed the project's source checks and 7 unit tests. The two deployment-path unit tests and the eight-page production build also passed. The complete five-viewport Chromium responsive run passed 747 checks. A WebKit touch run with normal motion at 360 and 390 px passed 317 checks. Both retain the blocked-script custom-control assertions.

A separate Chromium run passed 368 header, copy, runtime, overflow, focus and hover combinations across this project's routes, both preferences and these additional widths in CSS px: 320, 479, 480, 481, 519, 520, 521, 639, 640, 641, 719, 720, 721, 759, 760, 761, 900, 958, 959, 960, 1099, 1100, 1101. These include 320 px, intermediate widths and the actual breakpoint neighbors used by the reviewed sites. Its immutable captures are under ignored `output/responsive/header-logos-2026-10-04/after-neighbors/chromium/`.
