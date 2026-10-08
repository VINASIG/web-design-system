# Work on VINASIG Web Design System

This Astro repository publishes documentation, source tokens and interactive UI specimens for VINASIG websites. Its design rules and examples remain draft proposals pending owner approval. Public visibility does not approve their use in another project.

## Required project context

- Read [README.md](README.md) and [the complete project guide](docs/agents/project-guide.md) before implementation work. The complete guide retains the project-specific design, writing, asset and browser requirements.
- Read [the standards integration record](docs/agents/standards.md) for the pinned shared snapshot, installed skills and actual quality gates.
- Before visible UI changes, read [the UI quality workflow](docs/agents/ui-quality.md), the relevant specification under `docs/`, and the matching entry in `docs/elements/catalog.json` and `docs/elements/specimens.json`. Inspect its rendered example and platform label.
- Inspect `src/styles/tokens.css` and `src/styles/global.css` before changing shared UI. Keep design guidance and its published page consistent.

## Project requirements

- Preserve unrelated user changes. Use the existing branch. Commit, push, publish and deploy only within current user authorization.
- Use SI agents in VINASIG copy. Preserve external names, quotations, research titles and code identifiers. Keep source, technical documentation and commit subjects in English. Answer a Vietnamese user in Vietnamese.
- Use local Space Grotesk, Lucide for interface icons, Simple Icons for brand icons and approved provider marks for sign-in. Preserve supplied VINASIG artwork, identity anchors and font notices.
- Follow the project's draft Bright Playful Minimalism direction. Keep the established desktop UI, semantic HTML, focus and interaction behavior. Do not add generic decoration, unsolicited template chrome or dependencies without a concrete need.
- Keep pages static by default. Use the existing Astro, npm and Playwright infrastructure. Read [the technology decision](docs/decisions/0001-astro-and-cloudflare.md) before changing the stack.
- A URL or Markdown link does not import instructions or install components. This repository has no published design-system npm package.

## Verification and evidence

- Run `npm run check` and `npm run build` after implementation changes. Run `npm run test:standards` when changing the snapshot integrity gate.
- After UI changes, run `npm test` against the built site, inspect screenshots at the five standard viewports and include 320 px, affected breakpoints, touch, normal and reduced motion where relevant. Follow [the test guide](tests/README.md).
- Check the shared favicon, open dropdowns, keyboard behavior, names and states of changed controls. Fix overflow at its source. A successful build or automated assertion does not prove visual correctness.
- For masked control glyphs, verify actual forced-colors pixels in both light and dark palettes. A `currentColor` background can be replaced with Canvas and disappear. Use the user's system foreground, preserve state shapes, and require contrast in `tests/control-surfaces.mjs`. Keep the shared stylesheet copies consistent across consuming websites.
- Keep screenshots, browser reports, local bundles and logs under ignored `output/`. Record durable conclusions under `docs/audits/`. Report actual PASS, FAIL, NOT_RUN or NOT_APPLICABLE outcomes with evidence and limits.
- Read [the rights record](LICENSE_STATUS.md) before copying or redistributing source or assets. Do not invent a license grant, author attribution or deployment hostname.

## Canonical domain

The owner authorized the custom-domain migration on 4 October 2026. Publish this site at https://design.vinasig.io.vn/ with an origin-root base. Preserve that domain in canonical/social metadata, sitemap, robots, package homepage, preview and browser assertions. Keep GitHub repository/source links intact. Read docs/DOMAIN.md. GitHub Actions deploys through the repository Pages custom-domain setting; a CNAME file alone does not configure an Actions deployment.

## Language and appearance

Read `docs/LOCALIZATION.md`. Both locales must include navigation, accessible names, validation, loading and result copy. Keep native reciprocal language links and locale metadata. Preserve technical identifiers, code and user content. Only finite theme/language preferences use parent-domain cookies or local fallback under WEB-011. Never save or send measurements, files or generator content. Verify both locales and themes before publishing.

## Shared header and footer

Read docs/SITE_CHROME.md before header or footer changes. Keep shared chrome consistent and run npm run test:chrome.

For QR intake changes read `docs/components/qr-image-intake.md`. Keep the component and stylesheet pins synchronized with QR Scanner and TOTP Generator and verify their actual acquisition paths.
