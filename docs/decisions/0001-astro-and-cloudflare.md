# Decision 0001: Astro and Cloudflare Workers

**Status:** Draft proposal

**Date:** 2026-09-27

## Context

The VINASIG shared UI guide is primarily a content and documentation website. The first version needs to be static, quick to deploy, and easy for SI agents to inspect. Later versions may need server-rendered routes or API endpoints.

## Decision

Use Astro with static output and deploy the generated `dist/` assets to Cloudflare Workers.

## Reasons

- Astro prerenders pages and keeps browser JavaScript small by default, which fits a documentation portal.
- The same project can add Astro's Cloudflare adapter when request-time rendering or Worker bindings are needed.
- Wrangler can deploy static assets now and supports a Worker entry point when server behavior is introduced.
- The repository keeps content, implementation, and agent guidance together in ordinary text files.

## Consequences

- Keep the initial site static. Do not add a backend preemptively.
- Add server behavior only for a concrete feature that needs it, such as authenticated editing or user-specific content.
- Revisit the deployment configuration when the first dynamic route is approved.

## Sources

- [Astro on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)
- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/)
