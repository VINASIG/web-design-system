# VINASIG Design System Agent Guide

## Project context

This repository contains the VINASIG Design System: a documentation website and proposed shared UI rules for websites owned by the VINASIG organization. It is intended to give both people and AI agents a clear, reusable source of interface guidance.

## Status and authority

This is an early prototype. Every design rule, token, component example, and pattern published here is a **draft proposal** until a VINASIG owner approves it. Do not describe draft content as an approved organization policy, and do not silently impose it on another VINASIG website.

When a rule is missing or two sources disagree, explain the gap and propose an option. Do not invent a mandatory rule. Follow explicit instructions in the current task.

## Read the context you need

1. Read `README.md` for setup and deployment.
2. Read the relevant page under `docs/` before editing its website page or component.
3. Treat `src/styles/tokens.css` as the implementation source for design tokens.
4. See `docs/decisions/0001-astro-and-cloudflare.md` for the technology decision.

The documentation site is organized as follows:

- `docs/foundations/` holds color, typography, spacing, and responsive guidance.
- `docs/brand/` holds logo facts, asset mapping, and draft usage recommendations.
- `docs/components/` holds common interface controls and behavior.
- `docs/patterns/` holds reusable page-level interaction patterns.
- `src/pages/` contains the published documentation pages.
- `src/layouts/` and `src/components/` contain the documentation site's own UI.
- `public/brand/` contains exact copies of selected exported logo files. Editable artwork remains in the Brand Assets archive.
- `public/fonts/` contains the local Space Grotesk variable font and its license.

## Design and implementation rules

- Use Space Grotesk as the only named typeface. Load it from `public/fonts/SpaceGrotesk-VariableFont_wght.ttf`. Do not fetch fonts from a CDN or add another font family.
- Use the CSS custom properties in `src/styles/tokens.css` instead of repeating brand color values in component styles.
- Keep pages static by default. Add browser JavaScript only for a documented interaction that needs it.
- Use semantic HTML, visible keyboard focus, descriptive links, and accessible labels for form controls.
- For every task that creates or changes a website, inspect the shared `<head>` and confirm a favicon is configured. On VINASIG sites, use the supplied 16, 32, and 48 px favicon exports where available, and confirm the asset paths work for the deployment base URL. A header logo does not replace a browser favicon. If the required source asset is missing, report the gap instead of silently omitting or redrawing it.
- Before completing UI work, inspect each select control and dropdown in the changed flow. When the design calls for a custom dropdown, style both its closed trigger and open options panel. Preserve keyboard and assistive-technology behavior, and use the component guidance in `docs/components/README.md`.
- Keep rules and examples in English in this repository.
- When adding or changing guidance, keep its draft status visible and update both the source document and its published page.
- Use only the owner-provided logo exports in `public/brand/`. Do not redraw, alter, or add editable logo source files.
- The repository adds no license for VINASIG logo artwork. Do not infer an author name or licensing terms that are not in the source record.
- Use only Space Grotesk for typography. Do not add other fonts, remote font services, or third-party imagery without an explicit project decision.

## Writing and typography

- Write visible copy in clear, concise English. Keep the same language across a page and its related guidance.
- Do not use em dash or en dash characters. Use a hyphen-minus only where punctuation or a list marker needs one.
- Mark lists with hyphen-minus characters or a custom layout. Do not use round, square, arrow, or chevron glyphs as list markers.
- Avoid semicolons in prose, label-colon-value phrasing, term-dash definitions, parenthetical term definitions, and slash separators. Use a complete sentence instead. Keep punctuation required by code syntax.
- Use straight single and double quotation marks. Avoid unexplained abbreviations and all-caps wording, except for names, code, and identifiers that require it.
- Set body text near 1rem and use a small shared type scale. Keep supporting text readable and page titles at or below 2.75rem. Use hierarchy through weight and spacing rather than oversized type.
- Keep paragraphs concise. When a line would end with only one or two short words, rephrase the copy or adjust its measure where practical.

## Useful commands

- `npm install`: install dependencies.
- `npm run dev`: start the local development server.
- `npm run build`: build the static site into `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run deploy`: build and deploy to Cloudflare Workers after Cloudflare authentication is configured.
