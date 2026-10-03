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
- Keep screenshots, browser reports, local bundles and logs under ignored `output/`. Record durable conclusions under `docs/audits/`. Report actual PASS, FAIL, NOT_RUN or NOT_APPLICABLE outcomes with evidence and limits.
- Read [the rights record](LICENSE_STATUS.md) before copying or redistributing source or assets. Do not invent a license grant, author attribution or deployment hostname.
<!-- VINASIG STANDARDS BEGIN -->
## VINASIG SI agent standards 0.1.0

Read `.vinasig/standards/policies/core.md` and `language.md` before repository work. Respect platform instructions, current user authorization and local project guidance. Preserve unrelated changes. Never invent verification or weaken a quality gate to pass.

Active profile is `web-typescript`. Read `.vinasig/standards/profiles/web-typescript.md` and the task-relevant policies. Core is valid for CLI and documentation projects and installs no browser dependencies.

Use `$vinasig-workflow` for implementation work and `$vinasig-dependencies` when adding or upgrading dependencies. Report PASS, FAIL, NOT_RUN or NOT_APPLICABLE with evidence and reasons. Commit, push and publish only within the task authorization.

For license selection, imported material or distribution changes read `policies/licensing.md` and `LICENSES.md` inside the snapshot. LIC-001 through LIC-004 require purpose-based selection, authority and dependency review, separate documentation/font/data/brand rights, consistent SPDX metadata and delivery evidence. Importing this standard does not relicense the host project.

For UI changes read `policies/web.md` inside the snapshot. Apply LANG-004/LANG-005 to all visible copy and locales. WEB-001 requires original transparent header logos matched to the actual surface, without a padded or rounded logo card. WEB-008 requires styled open dropdowns, calendars, color choosers and sliders, including safe initial HTML before scripts load. Use `$vinasig-responsive` for layout/accessibility, `$vinasig-motion` for movement, `$vinasig-search` for SEO/AEO/GEO, `$vinasig-performance` for speed, and `$vinasig-agent-readiness` for browser-agent tasks. Space Grotesk, Lucide and Simple Icons follow their separate roles. Open and inspect real screenshots.

The local manifest pins the approved snapshot. A Markdown path is a reading instruction, not an automatic import. Stop and report unresolved conflicts with mandatory policy. Record approved exceptions with owner, reason and review date.
<!-- VINASIG STANDARDS END -->