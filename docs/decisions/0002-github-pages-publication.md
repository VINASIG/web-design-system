# Decision 0002: GitHub Pages publication

Reviewed on 3 October 2026 for the owner's request to verify and deploy the organization's websites.

## Context

The documentation website was public source without a configured deployment. The draft Cloudflare option in decision 0001 has no authenticated account in this environment. The other VINASIG static tools already publish through GitHub Pages with GitHub Actions.

## Decision

Publish the static documentation at [VINASIG Web Design System](https://vinasig.github.io/web-design-system/) through the existing repository checks workflow. Deployment depends on both Linux and Windows verification jobs. Use exact reviewed action commits and the checked `dist/` artifact. No external account, new credentials or custom domain is required.

Keep draft specifications as drafts. Deployment does not approve their adoption by other projects or grant a source or artwork license.

## Implementation

- Configure Astro's site URL, `/web-design-system` base and trailing slashes.
- Resolve navigation, images, downloads and favicons against the base. Keep original artwork bytes intact.
- Bundle the local font through the CSS asset pipeline so its URL follows the base.
- Test the production preview under the same base, including navigation, assets, the custom error page and interactive specimens.
- Upload only `dist/` after verification and deploy only main-branch builds. Pull requests run checks without publication.
- Keep Cloudflare as an optional authenticated deployment. `deploy:cloudflare` builds with a root base. A future custom deployment must set `SITE_URL` to its actual public origin before building and review its own routes.

The initial GitHub Pages deployment has no custom DNS configuration. See [Astro's GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/) and [GitHub's custom workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
