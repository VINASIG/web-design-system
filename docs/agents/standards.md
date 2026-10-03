# Shared standards integration

This project imports a reviewed local snapshot from [VINASIG/agent-standards](https://github.com/VINASIG/agent-standards). The snapshot supplies working rules and skills. The design specifications in this repository keep their existing draft status.

## Reviewed source

| Item | Value |
| --- | --- |
| Standards version | `0.1.0` public preview |
| Consumer profile | `web-typescript` |
| Source commit | `7c699d1dccd05c1dd2c4f0de4bb3abae23174ccd` |
| Bundle SHA-256 | `bd59e07ba80969e9e5b6788a9438e81ba14a6e22ce121e6ef192ef89f54cd07f` |
| Installed payload | 38 owned files, including seven namespaced skills |
| Source record | `.vinasig/provenance.json` |
| Installed manifest | `.vinasig/manifest.json` |

The manifest's `source.ref` identifies a content digest, not a Git commit or release tag. The separate provenance record pins the reviewed Git source and manifest digest. Integrity hashes detect drift against reviewed bytes. They are not signatures or a security boundary against a writer who can edit both source and provenance.

The copied source audit records repository access when that snapshot was created. Later visibility changes do not rewrite this immutable historical record. Check current access directly when fetching an external source.

## Project context and skill routing

The compact root `AGENTS.md` contains project requirements and one installer-owned block. Read [project-guide.md](project-guide.md) for the complete design, writing, assets and implementation rules. Read [ui-quality.md](ui-quality.md) before visible UI changes.

Installed skills live under `.agents/skills/` and cover workflow, dependencies, responsive behavior, motion, search, performance and agent readiness. The generated entrypoint routes each task to the appropriate skill and policy. Newly copied files do not prove that a running Codex session discovered them. A fresh session must check actual discovery. The static doctor and this repository's gate report runtime discovery as `NOT_RUN`.

## Actual enforcement

| Area | Repository enforcement |
| --- | --- |
| Snapshot integrity | `npm run check:standards` checks owned hashes, source provenance, instruction block, root override and 8 KiB budget without network access. |
| Gate regression | `npm run test:standards` uses isolated positive and negative fixtures. |
| Framework types | `astro check` uses Astro's strict configuration, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and framework-generated types. |
| Content and assets | `scripts/check-content.mjs` checks the catalog, icon registry, font and favicon assets. |
| Native script syntax | `node --check` covers the repository check and test scripts. |
| Browser regression | Playwright checks cover eight routes, required widths, interactive specimen states, touch, normal or reduced motion, base-aware navigation, font loading and favicon requests. |
| CI | The same gates run on Ubuntu and Windows. Actions are pinned to reviewed commits. |
| Dependency maintenance | Direct versions and the lockfile are pinned. Dependabot proposes reviewed updates and does not merge them automatically. |

The imported lint, formatting, HTML validation and Lighthouse presets are reference configurations. Importing them does not execute their tools. Typed ESLint for Astro, Stylelint, generated HTML validation and Lighthouse budgets have not been connected to this repository's gates. Automated axe audits were connected to every route and responsive viewport on 2026-10-03. They include the WCAG 2.2 target-size rules. Existing source and browser assertions remain required and have not been removed or weakened.

This is an explicit phased adoption inventory reviewed on 2026-10-02, with the next review proposed for 2026-10-16. Framework parser and file coverage must be tested before adopting those presets. Any exception to a mandatory rule requires the owner, reason and review date recorded through the shared exception procedure. This inventory is not an approval to suppress defects or claim full standards conformance.

The browser matrix was expanded on 2026-10-03 to managed Chromium, Firefox and WebKit on Linux and Windows. Read the final revision's CI results for observed outcomes. Real phones and screen-reader sessions remain `NOT_RUN`. The accessibility target is WCAG 2.2 AA. Existing geometry and keyboard assertions provide partial evidence, not a full accessibility audit.

## Reproduce or update the snapshot

Use a clean checkout of the reviewed agent-standards commit. Follow its [integration contract](https://github.com/VINASIG/agent-standards/blob/7c699d1dccd05c1dd2c4f0de4bb3abae23174ccd/docs/integration.md) to build a fresh bundle and inspect the file inventory and digest. A consumer checkout does not need the standards source or network access for ordinary checks.

From the separate standards checkout, in PowerShell:

```powershell
npm ci --ignore-scripts
npm run build
$taskBundle = node dist/bundle.js output/bundles/wds-reviewed | ConvertFrom-Json
$taskTarget = (Resolve-Path ../web-design-system).Path
# Use a digest only after reviewing the source, inventory and bundle.
$approvedSha256 = 'bd59e07ba80969e9e5b6788a9438e81ba14a6e22ce121e6ef192ef89f54cd07f'
node dist/cli.js init --target $taskTarget --bundle $taskBundle.path --sha256 $approvedSha256 --profile web-typescript --dry-run --json
node dist/cli.js init --target $taskTarget --bundle $taskBundle.path --sha256 $approvedSha256 --profile web-typescript --json
node dist/cli.js doctor --target $taskTarget --json
```

`init` with the same snapshot is idempotent. For a different reviewed snapshot, use the CLI's `diff`, `update --dry-run` and `update` sequence. Review owned changes and the root block, then update this project's provenance record and integration table with the new source commit, bundle digest and manifest digest. Run all affected project checks before committing.

Do not edit managed payload files or reformat the generated block. Put project-specific additions in the owner guide, or propose a shared change upstream. Installer backups and the exclusive installation lock are ignored local recovery material. Never commit an arbitrary backup, account token or personal machine path.

## Interface rules approved on 3 October 2026

The owner requested this standards update across VINASIG. LANG-004 requires natural punctuation, sentence case and custom list markers in authored interfaces. LANG-005 requires ordinary-reader language and limits parenthetical labels. Required code, URLs, times, regulatory identifiers, official names and user input retain their correct syntax.

WEB-008 requires matching closed and opened dropdown, calendar, color and slider controls. Operating-system popups do not satisfy the requirement. The snapshot includes `templates/web/interface.mjs` for rendered-copy and control regressions. Consumer tests exercise real routes and dynamic states. Visual, keyboard and ordinary-language review remain necessary.

## Header rules approved on 4 October 2026

The owner approved original transparent horizontal logos selected for the actual header surface under WEB-001. Keep the source asset bytes, proportions and internal artwork. Avoid white panels, padded or rounded cards and artwork effects. Maintain the accessible logo link and its usable target independently of image size.

This reviewed snapshot adds `inspectHeaderBrand` to `templates/web/interface.mjs`. The consumer browser regressions check the real header alongside rendered copy. Asset integrity, screenshot review and script-unavailable states remain separate checks.
