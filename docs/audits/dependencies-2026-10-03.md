# Dependency review on 3 October 2026

This review covers the open Dependabot proposals and the current supported toolchain. Registry metadata and each proposal's manifest, lockfile and CI result were inspected before resolution.

## Selected versions

- The verification runtime is pinned to Node 24.21.0, the current stable patch in the supported Node 24 line, with its npm 11.19.0 release. Consumer minimum runtime support remains unchanged.
- TypeScript remains pinned to 6.0.3. The latest stable registry release is 7.0.2.
- `@astrojs/check` 0.9.10 accepts TypeScript `^5.0.0 || ^6.0.0`. Its current peer contract also excludes TypeScript 7.

## Pull requests

- [PR #1](https://github.com/VINASIG/web-design-system/pull/1) proposes TypeScript 7.0.2, which the required toolchain does not support. The proposal was closed with its compatibility reason. Required checks remain in place.

## Maintenance policy

Dependabot continues weekly npm and GitHub Actions updates. A targeted version ignore prevents repeated TypeScript 7 proposals until the required compiler consumers support that major. Projects with Node declarations ignore major 25 and above while Node 24 is the supported runtime. Updates within supported ranges remain eligible for review.

Review these bounds by 17 October 2026, and before adopting a new compiler, checker, typed lint or runtime major. A compatible migration must update the manifest and lockfile together and pass the repository's source, behavior and CI gates. Security updates still require review, including any change that needs a runtime migration.

Registry sources are [TypeScript](https://registry.npmjs.org/typescript/latest), [typescript-eslint](https://registry.npmjs.org/typescript-eslint/latest), [Astro checker](https://registry.npmjs.org/@astrojs/check/latest), [Node declarations](https://registry.npmjs.org/@types/node) and [ESLint](https://registry.npmjs.org/eslint/latest). The organization audit retains the dated metadata, original proposal diffs, CI diagnostics and subsequent verification receipts under ignored `output/org-audit-2026-10-03/` in the `vinasig` checkout. CI checks for the final pushed revision provide the public execution evidence.
