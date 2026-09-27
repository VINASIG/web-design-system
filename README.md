# VINASIG Design System

An AI-readable design-system website for shared interface guidance across VINASIG projects. This is a first prototype; all rules and examples are proposals pending approval.

## Technology

- **Astro** generates a static site by default, with very little browser-side JavaScript.
- **Cloudflare Workers** serves the generated static files. Astro's Cloudflare adapter can be added later if a route needs server rendering, sessions, or API behavior.
- **Space Grotesk** is the only typeface used. The variable font is served locally; the included `public/fonts/OFL.txt` is its license notice.

## Run locally

```sh
npm install
npm run dev
```

Build and preview the static output:

```sh
npm run build
npm run preview
```

## Deploy

The project is configured for Cloudflare Workers static assets. To deploy from a local machine, authenticate with Cloudflare once and run:

```sh
npx wrangler login
npm run deploy
```

For automatic deployments, connect this GitHub repository to **Workers Builds** and set the production branch to `main`, the build command to `npm run build`, and the deploy command to `npx wrangler deploy`. Cloudflare creates preview deployments for review.

The static site can stay pre-rendered as it grows. If a future page needs request-time data, authentication, or an API, add Astro's Cloudflare adapter and render only the routes that need server behavior.

## AI-agent entry points

- Start with [`AGENTS.md`](AGENTS.md) for project context, authority, and navigation.
- Use [`llms.txt`](public/llms.txt) as a compact index of the published guidance.
- The source specifications live under [`docs/`](docs/); the website pages under [`src/pages/`](src/pages/) publish them.
- Tokens are implemented in [`src/styles/tokens.css`](src/styles/tokens.css).
- Logo facts and usage guidance are in [`docs/brand/README.md`](docs/brand/README.md), published at `/brand/`.

## Rights and provenance

The font file is Space Grotesk under the SIL Open Font License; its notice is included alongside the file. `public/brand/` contains exact copies of selected logo exports supplied in the VINASIG Brand Assets archive, for project documentation and use examples. This repository adds no license for VINASIG names, marks, or logo artwork; do not infer an author name or extra licensing terms.
