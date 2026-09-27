# VINASIG Design System — Agent Guide

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

- `docs/foundations/`: colors, typography, spacing, and responsive behavior.
- `docs/components/`: common interface controls and component behavior.
- `docs/patterns/`: reusable page-level interaction patterns.
- `src/pages/`: the published documentation pages.
- `src/layouts/` and `src/components/`: the documentation site's own UI.
- `public/fonts/`: the local Space Grotesk variable font and its license.

## Design and implementation rules

- Use Space Grotesk as the only named typeface. Load it from `public/fonts/SpaceGrotesk-VariableFont_wght.ttf`; do not fetch fonts from a CDN or add another font family.
- Use the CSS custom properties in `src/styles/tokens.css` instead of repeating brand color values in component styles.
- Keep pages static by default. Add browser JavaScript only for a documented interaction that needs it.
- Use semantic HTML, visible keyboard focus, descriptive links, and accessible labels for form controls.
- Keep rules and examples in English in this repository.
- When adding or changing guidance, keep its draft status visible and update both the source document and its published page.
- Avoid adding logo artwork, third-party images, or new fonts without an explicit project decision.

## Useful commands

- `npm install`: install dependencies.
- `npm run dev`: start the local development server.
- `npm run build`: build the static site into `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run deploy`: build and deploy to Cloudflare Workers after Cloudflare authentication is configured.
