# VINASIG Web Design System

A source repository and static documentation website for people and SI agents that provides shared interface guidance across VINASIG projects. All design rules, tokens and examples are draft proposals pending owner approval. Making the repository public does not approve an organization-wide rollout.

The canonical repository is [VINASIG/web-design-system](https://github.com/VINASIG/web-design-system). Shared working rules come from [VINASIG/agent-standards](https://github.com/VINASIG/agent-standards), and artwork is maintained in [VINASIG/vinasig-brand-assets](https://github.com/VINASIG/vinasig-brand-assets). This repository contains selected supplied brand exports for its documentation.

Open the [documentation website](https://design.vinasig.io.vn/). GitHub Actions publishes the checked static build from `main` after Linux and Windows verification.

VINASIG uses **Super Intelligence (SI)** and **SI agents** as its preferred terms in project-authored copy. This is a naming convention, not a claim that every current system exceeds human intelligence. Preserve original wording in research titles, quotations, official names, laws, and technical identifiers.

## Technology

- **Astro** generates a static site by default, with very little browser-side JavaScript.
- **GitHub Pages** serves the checked static documentation. Cloudflare Workers remains an optional authenticated deployment. See [the publication decision](docs/decisions/0002-github-pages-publication.md).
- **Space Grotesk** is the only typeface used. The variable font is served locally. The included `public/fonts/OFL.txt` is its license notice.
- Interface arrows and pictographic icons use Lucide SVGs. Third-party company and product logos use Simple Icons with contextual color; provider sign-in marks follow their official brand guidance. Space Grotesk symbols may appear in prose or typographic notation.

## Run locally

Use Node 24.21.0 from `.node-version` and npm 11.19.0 from `packageManager`. This repository supports the Node 24 line. `package-lock.json` records the dependency graph for reproducible installs.

```sh
git clone https://github.com/VINASIG/web-design-system.git
cd web-design-system
npm ci --ignore-scripts
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
npm run test:standards
npx playwright install chromium
npm run build
npm test
```

- `npm run check` validates the reviewed standards snapshot, catalog coverage, icon registration, local assets, script syntax and Astro TypeScript diagnostics.
- `npm run test:standards` verifies that the integrity gate accepts the pinned snapshot and rejects changed payloads, modified manifests, unsafe paths, damaged instruction blocks and a shadowing root override.
- `npm test` checks the static routes and repaired UI states at five responsive viewports. It starts its own production preview on a free port and saves screenshots and results to `output/responsive/runs/`.
- GitHub Actions runs the same checks on Ubuntu and Windows for pushes to `main` and pull requests, including touch with normal motion at 320, 360 and 390 px. Generated browser artifacts are retained for 14 days. Actions are pinned to reviewed commits. Dependabot proposes weekly dependency updates for review.

See [the test guide](tests/README.md) for browser setup, custom widths and touch or motion options. Keep generated output, local logs, credentials and environment files outside Git. Check the actual rendered UI as described in [the UI quality workflow](docs/agents/ui-quality.md) when changing visible code.

## Repository structure

| Directory                            | Purpose                                                             |
| ------------------------------------ | ------------------------------------------------------------------- |
| `src/pages/`                         | Static documentation routes and the element library.                |
| `src/components/` and `src/layouts/` | Shared site UI and document shell.                                  |
| `src/scripts/`                       | Browser interactions and shared icon registry.                      |
| `src/styles/`                        | Design tokens and shared styles.                                    |
| `docs/`                              | Draft specifications, decisions and audit records.                  |
| `public/`                            | Supplied brand exports, provider marks, local font and agent index. |
| `scripts/`                           | Repository content checks.                                          |
| `tests/`                             | Portable responsive regression and preview helper.                  |
| `.agents/skills/`                    | Locally imported VINASIG skills for a fresh agent session.          |
| `.vinasig/`                          | Reviewed standards snapshot, manifest and source provenance.        |
| `output/`                            | Ignored local screenshots, logs and inspection evidence.            |

## Deploy

The default publication is GitHub Pages at https://design.vinasig.io.vn/ with an origin-root base. Push an authorized, reviewed change to `main` to run source, standards and browser checks on Linux and Windows. Deployment depends on both verification jobs and publishes only `dist/`. Pull requests run verification without deployment.

To rerun the checked publication from an authenticated GitHub CLI:

```sh
npm run deploy
```

`BASE_PATH` and `SITE_URL` can configure another reviewed static deployment. The production preview and path regression use the configured base. Internal links, downloads, favicons and local fonts must resolve under that same path.

Cloudflare Workers is optional. Authenticate with the intended Cloudflare account, set `SITE_URL` to its actual public origin, and run:

```sh
npx wrangler login
npm run deploy:cloudflare
```

The optional Cloudflare command builds at the origin root before uploading static assets. It requires its own account configuration and is separate from GitHub Pages. The repository does not store deployment credentials.

The static site can stay pre-rendered as it grows. If a future page needs request-time data, authentication, or an API, add Astro's Cloudflare adapter and render only the routes that need server behavior.

## Guidance for SI agents

- Use the [UI element library source](docs/elements/catalog.json) and its [rendered examples](docs/elements/specimens.json) for all 81 web and macOS interface entries. The published library is at /elements/.
- Start with [`AGENTS.md`](AGENTS.md) for project context, authority, and navigation.
- Read [the complete project guide](docs/agents/project-guide.md) and [the standards integration record](docs/agents/standards.md). The root entrypoint stays within the shared instruction budget, while the complete guide retains all project-specific requirements.
- Follow the [SI agent UI quality workflow](docs/agents/ui-quality.md) before creating or changing visible interface code.
- Use [`llms.txt`](public/llms.txt) as a compact index of the published guidance.
- The source specifications live under [`docs/`](docs/). The website pages under [`src/pages/`](src/pages/) publish them.
- Tokens are implemented in [`src/styles/tokens.css`](src/styles/tokens.css).
- Logo facts and usage guidance are in [`docs/brand/README.md`](docs/brand/README.md), published at `/brand/`.

## Use in another project

Import the reviewed working standard using [the agent-standards integration procedure](https://github.com/VINASIG/agent-standards/blob/main/docs/integration.md). It writes a marked `AGENTS.md` block, a manifest and namespaced skills inside the target repository. A link alone does not load those files or install a package.

Separately record the design-system commit used by the project. Read the relevant source specifications and review token or component adoption against that project's approved design. This repository has no published npm design-system package. Its Astro components and demonstration interactions are source examples, not a framework-independent component API. Confirm owner approval before treating draft guidance as a requirement.

See [CONTRIBUTING.md](CONTRIBUTING.md) for changes and bug reports, [SECURITY.md](SECURITY.md) for vulnerability reporting, and [CHANGELOG.md](CHANGELOG.md) for the repository history.

## Rights and provenance

The owner selected AGPL-3.0-or-later for the website implementation and CC-BY-SA-4.0 for authored documentation. The package keeps `private: true` to prevent accidental npm publication. See [LICENSES.md](LICENSES.md) for exact scopes and [LICENSE_STATUS.md](LICENSE_STATUS.md) for the current rights record.

Space Grotesk retains its SIL Open Font License notice. `public/brand/` contains exact copies of supplied VINASIG exports governed by [the separate brand policy](BRAND_POLICY.md). Third-party marks remain subject to their owners' rights and brand rules.

## Canonical domain

The public site uses [design.vinasig.io.vn](https://design.vinasig.io.vn/) at the origin root. GitHub Pages remains the deployment service. [Domain maintenance](docs/DOMAIN.md) records DNS, HTTPS, search submission and verification boundaries.

## License scopes

VINASIG-authored software uses **AGPL-3.0-or-later**. Authored documentation uses **CC-BY-SA-4.0**. Commercial use is allowed under those standard licenses. Fonts and third-party components retain their original terms. Official VINASIG identity assets follow the separate brand policy.

Read [LICENSE](LICENSE), [LICENSES.md](LICENSES.md), [VINASIG Brand Usage Policy](BRAND_POLICY.md) and [the licensing review](docs/audits/licensing-2026-10-04.md) for exact scopes, rationale and remaining review.

## Languages and appearance

English `/` and Vietnamese `/vi/` provide the same features with localized navigation, guidance and accessible controls. Use the compact EN or VI link and adjacent theme button. Only an explicit appearance preference is stored. Inputs and files remain local and unsaved. See [localization maintenance](docs/LOCALIZATION.md).
