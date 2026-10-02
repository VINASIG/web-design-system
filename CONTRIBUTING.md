# Contribute to VINASIG Web Design System

Read [AGENTS.md](AGENTS.md), [the complete project guide](docs/agents/project-guide.md) and the source specification for the area you are changing. The current design guidance is a draft. A contribution does not approve its use across VINASIG projects.

## Prepare a change

Use Node 24.19.0 and npm 11.17.0, install with `npm ci --ignore-scripts`, and keep `package-lock.json` in sync. Keep changes focused and preserve unrelated work. Write source, technical documentation and commit subjects in English.

Update both a source specification and its published page when guidance changes. Reuse Space Grotesk, existing tokens, Lucide and supplied assets. Keep required font and third-party notices. Explain any design or dependency decision that affects consumers.

## Verify a change

```sh
npm run check
npm run test:standards
npm run build
npx playwright install chromium
npm test
```

For UI changes, follow [the UI workflow](docs/agents/ui-quality.md) and [the test guide](tests/README.md). Open screenshots, exercise affected controls and record actual widths, states, keyboard checks and limitations. Use a fresh run name for before and after evidence. Keep generated output under ignored `output/`, and put durable findings under `docs/audits/`.

The imported snapshot is managed content. Do not reformat or edit it to pass checks. Propose a shared policy change in [agent-standards](https://github.com/VINASIG/agent-standards), then review its bundle and update this consumer explicitly. The integration procedure is in [docs/agents/standards.md](docs/agents/standards.md).

## Report a bug or propose guidance

Open an issue with the relevant route or source file, expected behavior, actual behavior and reproduction steps. For responsive defects, include viewport dimensions, control state and a screenshot without private data. For new guidance, include its scope, rationale, source and proposed approval status.

Use a pull request to make a reviewable change. Describe what changed, why, which checks ran and any unverified behavior. Report security vulnerabilities through [SECURITY.md](SECURITY.md).

## Rights

Contributions do not introduce a new license or transfer rights to existing artwork. Check [LICENSE_STATUS.md](LICENSE_STATUS.md) before including third-party material. License grants, package releases and production deployment require their own owner decision.
