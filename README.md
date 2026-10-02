# VINASIG Design System

An AI-readable design-system website for shared interface guidance across VINASIG projects. This is a first prototype. All rules and examples are proposals pending approval.

## Technology

- **Astro** generates a static site by default, with very little browser-side JavaScript.
- **Cloudflare Workers** serves the generated static files. Astro's Cloudflare adapter can be added later if a route needs server rendering, sessions, or API behavior.
- **Space Grotesk** is the only typeface used. The variable font is served locally. The included `public/fonts/OFL.txt` is its license notice.
- Interface arrows and pictographic icons use Lucide SVGs. Third-party company and product logos use Simple Icons with contextual color; provider sign-in marks follow their official brand guidance. Space Grotesk symbols may appear in prose or typographic notation.

## Run locally

Use Node 24 as recorded in `.node-version`. The minimum supported Node version is 22.12.0. npm is the package manager, and `package-lock.json` is the dependency source for reproducible installs.

```sh
npm ci
npm run dev
```

Build and preview the static output:

```sh
npm run build
npm run preview
```

## Check changes

```sh
npm run check
npx playwright install chromium
npm run build
npm test
```

- `npm run check` validates catalog coverage, icon registration, local assets, script syntax and Astro TypeScript diagnostics.
- `npm test` checks the static routes and repaired UI states at five responsive viewports. It starts its own production preview on a free port and saves screenshots and results to `output/responsive/runs/`.
- GitHub Actions runs the same checks for pushes to `main` and pull requests. Generated browser artifacts are retained for 14 days.

See [the test guide](tests/README.md) for browser setup, custom widths and touch or motion options. Keep generated output, local logs, credentials and environment files outside Git. Check the actual rendered UI as described in [the UI quality workflow](docs/agents/ui-quality.md) when changing visible code.

## Repository structure

| Directory | Purpose |
| --- | --- |
| `src/pages/` | Static documentation routes and the element library. |
| `src/components/` and `src/layouts/` | Shared site UI and document shell. |
| `src/scripts/` | Browser interactions and shared icon registry. |
| `src/styles/` | Design tokens and shared styles. |
| `docs/` | Draft specifications, decisions and audit records. |
| `public/` | Supplied brand exports, provider marks, local font and agent index. |
| `scripts/` | Repository content checks. |
| `tests/` | Portable responsive regression and preview helper. |
| `output/` | Ignored local screenshots, logs and inspection evidence. |

## Deploy

The project is configured for Cloudflare Workers static assets. To deploy from a local machine, authenticate with Cloudflare once and run:

```sh
npx wrangler login
npm run deploy
```

For automatic deployments, connect this GitHub repository to **Workers Builds** and set the production branch to `main`, the build command to `npm run build`, and the deploy command to `npx wrangler deploy`. Cloudflare creates preview deployments for review.

The static site can stay pre-rendered as it grows. If a future page needs request-time data, authentication, or an API, add Astro's Cloudflare adapter and render only the routes that need server behavior.

## AI-agent entry points

- Use the [UI element library source](docs/elements/catalog.json) and its [rendered examples](docs/elements/specimens.json) for all 81 web and macOS interface entries. The published library is at /elements/.
- Start with [`AGENTS.md`](AGENTS.md) for project context, authority, and navigation.
- Follow the [AI-assisted UI quality workflow](docs/agents/ui-quality.md) before creating or changing visible interface code.
- Use [`llms.txt`](public/llms.txt) as a compact index of the published guidance.
- The source specifications live under [`docs/`](docs/). The website pages under [`src/pages/`](src/pages/) publish them.
- Tokens are implemented in [`src/styles/tokens.css`](src/styles/tokens.css).
- Logo facts and usage guidance are in [`docs/brand/README.md`](docs/brand/README.md), published at `/brand/`.

## Rights and provenance

The font file is Space Grotesk under the SIL Open Font License. Its notice is included alongside the file. `public/brand/` contains exact copies of selected logo exports supplied in the VINASIG Brand Assets archive, for project documentation and use examples. This repository adds no license for VINASIG names, marks, or logo artwork. Do not infer an author name or extra licensing terms.
