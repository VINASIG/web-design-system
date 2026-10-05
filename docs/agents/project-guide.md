# VINASIG Design System Project Guide

Read this complete project guide after the compact root `AGENTS.md`. The root routes shared working rules through the reviewed local snapshot. This document preserves the project-specific requirements and remains required context for implementation work.

## Project context

This repository contains the VINASIG Design System: a documentation website and proposed shared UI rules for websites owned by the VINASIG organization. It is intended to give both people and SI agents a clear, reusable source of interface guidance.

## Status and authority

This is an early prototype. Every design rule, token, component example, and pattern published here is a **draft proposal** until a VINASIG owner approves it. Do not describe draft content as an approved organization policy, and do not silently impose it on another VINASIG website.

When a rule is missing or two sources disagree, explain the gap and propose an option. Do not invent a mandatory rule. Follow explicit instructions in the current task.

## Project terminology

Use **Super Intelligence (SI)** and **SI agents** as the preferred terms in new VINASIG-authored copy. This is a naming convention, not a claim that every current system exceeds human intelligence. Preserve original wording in research titles, quotations, official names, laws, code, and external references.

## Read the context you need

1. Read `README.md` for setup and deployment.
2. Read the relevant page under `docs/` before editing its website page or component.
3. Treat `src/styles/tokens.css` as the implementation source for design tokens. Consult `src/styles/global.css` before changing shared styles or adding a new global component rule.
4. See `docs/decisions/0001-astro-and-cloudflare.md` for the technology decision.

The documentation site is organized as follows:

- `docs/foundations/` holds color, typography, spacing, and responsive guidance.
- `docs/brand/` holds logo facts, asset mapping, and draft usage recommendations.
- `docs/components/` holds common interface controls and behavior.
- `docs/patterns/` holds reusable page-level interaction patterns.
- `docs/agents/ui-quality.md` records the research-backed workflow for reviewing SI-assisted interface work.
- `src/pages/` contains the published documentation pages.
- `src/layouts/` and `src/components/` contain the documentation site's own UI.
- `public/brand/` contains exact copies of selected exported logo files. Editable artwork remains in the Brand Assets archive.
- `public/fonts/` contains the local Space Grotesk variable font and its license.

## Design and implementation rules

When an interface matches an entry in docs/elements/catalog.json, read its definition and inspect the matching rendered example in docs/elements/specimens.json. Apply Web guidance to websites. Treat macOS entries as native desktop concepts and use their web adaptation only when it fits the user need.

- Use Space Grotesk as the only named typeface. Load it from `public/fonts/SpaceGrotesk-VariableFont_wght.ttf`. Do not fetch fonts from a CDN or add another font family.
- Use Lucide SVGs for interface icons, through the shared `src/components/Icon.astro` component or the Lucide icon registry in `src/scripts/icons.ts`. Do not type pictographic Unicode characters, emoji, or private-use codepoints into page markup or CSS.
- Use Simple Icons for third-party company and product logos such as Google or Apple. Their renderer inherits `currentColor` by default; set a brand color only when the specific context and the brand's current rules call for it, rather than applying `icon.hex` automatically. Provider sign-in buttons must use the provider-approved mark and follow its brand rules (for example, Google sign-in uses the standard multicolor G, not a monochrome mark). Keep brand marks separate from general interface icons.
- Space Grotesk symbols may appear in prose or typographic notation. Use Lucide for interface arrows and pictographic icons shown alongside each other so they share one visual style.
- Use semantic color tokens from `src/styles/tokens.css` and follow the color role mapping in `docs/foundations/README.md`. Keep the VINASIG identity color anchors unchanged. Use their soft, border, and strong shades for interface states. Do not add unrelated saturated colors without a documented role.
- When a component needs additional categories, use the optional extended palette documented in the Foundations guide. Treat it as supporting color, preserve identity aliases, and keep semantic status colors in their established roles.
- Use **Bright Playful Minimalism** as the draft visual direction for this prototype. Start with a flat, content-led minimal layout, light neutral surfaces, and selective identity color. Use pixel or rounded-square details sparingly, and add illustrations only when they explain content or support a clear user need. Follow `docs/foundations/README.md` for the full direction.
- Do not fall back to generic generated decoration such as oversized hero type, gradients, card grids without distinct content, or decorative pills and badges. Use cards when they clarify a real content group. Do not imitate or combine Apple, GitHub, or Duolingo as complete visual systems. Borrow a specific quality only when the task names it, then express it through VINASIG's existing tokens and patterns.
- Keep pages static by default. Add browser JavaScript only for a documented interaction that needs it.
- Use semantic HTML, visible keyboard focus, descriptive links, and accessible labels for form controls.
- Do not add version labels, draft badges, prototype-status footers, repeated navigation links, machine-readable index links, or other template chrome by default. Add visible elements only when the task requests them, an authoritative requirement requires them, or they support a defined user need. Preserve required third-party attributions and legal notices.
- Check current official framework and browser documentation, plus the project's browser support target, before choosing an unfamiliar or recently released web API. Do not rely on model memory for changing platform behavior.
- Treat the accessibility tree as part of the interface. Give interactive controls semantic roles, useful accessible names, and accurate selected, expanded, and disabled states. When browser automation is available, prefer locating controls by role and name.
- For every task that creates or changes a website, inspect the shared `<head>` and confirm a favicon is configured. On VINASIG sites, use the supplied 16, 32, and 48 px favicon exports where available, and confirm the asset paths work for the deployment base URL. A header logo does not replace a browser favicon. If the required source asset is missing, report the gap instead of silently omitting or redrawing it.
- Before completing UI work, apply LANG-004/LANG-005 to every locale and dynamic state. WEB-008 requires styled closed and open dropdowns, calendars, color controls and slider tracks/thumbs. Operating-system select/date/color popups do not meet that requirement. Use the reviewed controls in `docs/components/README.md`, preserve form and keyboard behavior, and inspect actual opened controls in supported engines.
- Import `src/styles/control-surfaces.css` after base styles. Inventory hidden and revealed controls, checkbox/radio marks, range tracks/thumbs, search clearing, number steppers, uploads, progress/meter values, disclosure markers and popup scrollbars. Run `inspectControlSurfaces` on initial and opened states with expected-control counts. Reach the final option, verify normal scrolling, and review the deployed site. System controls are a documented forced-colors fallback, not a normal-theme substitute.
- Before creating or changing visible interface code, read `docs/agents/ui-quality.md` and follow its UI workflow. Include the relevant viewport, content, interaction, and accessibility checks in the task plan. Do not treat a successful build or one desktop screenshot as proof that the UI is complete.
- Review shared chrome in the complete product layout. The documentation sidebar/content grid, identity header and footer must use one centered content band and shared safe gutters. Use theme tokens for navigation and inspect both ends of a long page. Do not accept isolated header/footer checks as proof that the sidebar and document align. Follow `docs/components/site-chrome.md` for this integration.
- When isolating specimen colors from the documentation theme, put the reference palette and canvas on the full preview stage. Keep width-limited layout wrappers transparent and leave real component surfaces to those components. Inspect sample boundaries and padding in both themes, including small controls, cards and opened panels. Follow `docs/elements/README.md`.
- When the user supplies a screenshot, mockup, or URL, record what must match and preserve the existing control types and behavior. Do not replace a reference with a generic generated layout.
- Implement visual changes in bounded slices. After each slice, inspect the real page at the target widths and recheck areas that already passed. If the same defect remains after two targeted corrections, diagnose the layout, styles, and project context before adding another override.
- When visual browser inspection is available, inspect changed pages at wide, medium, and narrow widths, including a 320 CSS px reflow check where practical. Exercise changed controls in their open and keyboard states. Fix the cause of overflow or clipping instead of hiding it with a broad CSS workaround.
- Use `npm run check` after source changes. For responsive work, follow `tests/README.md`, build the site and run `npm test`. Keep generated inspection evidence under ignored `output/`, and record durable audit conclusions under `docs/audits/`. Inspect screenshots before accepting a visual result.
- Keep the existing product identity. Reuse its approved tokens, typeface, icon component, assets, and established patterns. Do not accept a generic generated layout or invent brand choices just to fill gaps. Ask or report the unresolved decision when the source context is insufficient.
- Keep source guidance in English and maintain the reviewed Vietnamese website translation.
- When adding or changing guidance, keep its draft status visible and update both the source document and its published page.
- Use only the owner-provided logo exports in `public/brand/`. Do not redraw, alter, or add editable logo source files.
- VINASIG logo artwork is excluded from the software and documentation grants. Follow BRAND_POLICY.md for permitted references. Do not infer an author name, assignment or broader permission from repository access.
- Use only Space Grotesk for typography. Do not add other fonts, remote font services, or third-party imagery without an explicit project decision.

## Writing and typography

- Write visible copy in clear, concise Vietnamese and English. Keep the same language across a page and its related guidance.
- Do not use em dash or en dash characters. Use a hyphen-minus only where punctuation or a list marker needs one.
- Mark lists with hyphen-minus characters or a custom layout. Do not use round, square, arrow, or chevron glyphs as list markers.
- Avoid semicolons in prose, label-colon-value phrasing, term-dash definitions, parenthetical term definitions, and slash separators. Use a complete sentence instead. Keep punctuation required by code syntax.
- Use straight single and double quotation marks. Avoid unexplained abbreviations and all-caps wording, except for names, code, and identifiers that require it.
- Set body text near 1rem and use a small shared type scale. Keep supporting text readable and page titles at or below 2.75rem. Use hierarchy through weight and spacing rather than oversized type.
- Keep paragraphs concise. When a line would end with only one or two short words, rephrase the copy or adjust its measure where practical.

## Useful commands

- `npm ci`: install the locked dependencies. Use the Node version in `.node-version`.
- `npm run dev`: start the local development server.
- `npm run check`: validate catalog and icons, script syntax and Astro TypeScript diagnostics.
- `npm run build`: build the static site into `dist/`.
- `npx playwright install chromium`: install the managed browser for responsive tests.
- `npm test`: run responsive regression against an automatically started production preview after building.
- `npm run preview`: preview the production build locally.
- `npm run deploy`: rerun the GitHub Actions verification and Pages deployment from the authenticated GitHub CLI.
- `npm run deploy:cloudflare`: build at the root and deploy to an explicitly configured Cloudflare account. Set `SITE_URL` to its real origin first.
