# Changelog

## Shared palette - 2026-10-08

- Adopt the exact reviewed Brand Assets palette through a pinned source revision and SHA-256 record.
- Generate palette CSS from the shared JSON and render Foundations swatches from the same data in English and Vietnamese.
- Use VINASIG names, 16 base colors and all 30 reviewed deep tones. Keep one small inspiration credit and preserve the five identity anchors and semantic UI shades.
- Add source, corruption and rendered-color regressions to existing local checks and the complete CI browser matrix.

## 0.1.0 public preview - 2026-10-02

- Standardize the repository under `VINASIG/web-design-system` with canonical source metadata, contribution guidance, security reporting and explicit rights status.
- Import the reviewed `VINASIG/agent-standards` 0.1.0 snapshot with the `web-typescript` profile, seven namespaced skills, source provenance and offline integrity checks.
- Keep the root agent entrypoint below 8 KiB and retain the complete project-specific design guide in `docs/agents/project-guide.md`.
- Correct the consuming guide to describe real source adoption and snapshot imports. There is no published design-system npm package.
- Pin direct dependencies and the tested Node/npm toolchain. Update Lucide and Wrangler to reviewed compatible stable versions.
- Enable checked indexed access and exact optional properties. Resolve the 33 newly exposed diagnostics in demo state, date parsing, labels and keyboard selection without suppressing the compiler.
- Repair overlapping Vibrancy material labels at narrow component widths using the existing container query and add a browser regression for text containment.
- Pin GitHub Actions to reviewed commits and run source, integrity, build and responsive checks on Ubuntu and Windows. Add weekly dependency update proposals without automatic merging.

Design rules, tokens, component specimens and usage recommendations remain draft proposals pending owner approval. This entry does not announce an npm release, license grant or organization-wide design approval.
