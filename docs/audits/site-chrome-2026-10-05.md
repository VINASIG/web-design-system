# Shared header and footer audit - 5 October 2026

## Request and findings

The owner requested consistent headers and footers across all published VINASIG websites, with project-start guidance in agent-standards. Nine published sites were inspected. The documentation site previously kept identity and preferences in its sidebar/topbar and had no common website footer. Product websites independently chose logo widths, source-link positions and footer content. Existing compact layout rules also overrode common safe spacing.

## Changes

The reviewed contract is docs/components/site-chrome.md. Its shared sources are src/styles/site-chrome.css and src/components/SiteFooter.astro. Original transparent brand artwork and fonts are unchanged. The identity header uses the original 132 px lockup and two 44 px appearance/language targets. Product documentation navigation remains in the sidebar. The common footer contains homepage, source, issues and local licensing destinations. Local AGENTS guidance and npm run test:chrome prevent independent chrome defaults.

The central WEB-009 policy and new-project checklist were adopted from VINASIG/agent-standards commit 9285e34f883cd414a16e50a79994da2a888efa3a. Consumer-owned source and instructions remain outside existing immutable standards snapshots. This approval covers shared chrome and previously approved writing/controls, not unrelated draft design proposals.

## Actual verification

- Source/standards/content/script checks, Astro TypeScript checks and license checks passed with pinned Node 24.21.0 and npm 11.19.0. Build passed.
- Seven standards tests and two path tests passed.
- Shared-chrome checks passed for 16 routes, both themes, 13 widths and Chromium, Firefox and WebKit, totaling 1,248 route/theme/width cases. Routes were /, /vi/, the six documentation sections in both locales, /404.html and /vi/404/.
- Widths were 320, 360, 390, 600, 759, 760, 761, 768, 776, 777, 778, 1024 and 1440. Compact spacing follows actual CSS media-query state, including classic WebKit scrollbars. The manual screenshot matrix included 360x800, 390x844, 768x1024, 1024x768 and 1440x900, plus 320x800.
- The existing responsive suite passed 804 checks. Existing localization checks passed on all three engines. Control indicator checks passed 108 cases, and control surface checks passed 12 cases with eight forced-color states.
- Actual header/footer screenshots were captured and opened in both locales and themes, including the page bottom after complete scrolling. Supplemental 200% text checks ran on all three engines, with finite header/footer captures. WebKit widths 771, 772 and 773 were additionally checked around its content viewport transition.
- Keyboard appearance toggling, reciprocal language links, licensing HTTP responses, one header/footer per route, hit targets, logo alignment and no-JavaScript theme artwork were verified. No physical phones or screen-reader sessions were used.

## Evidence and publication

Local per-project logs are output/site-chrome/. The regression is tests/site-chrome.ts, with the reviewed CSS digest in tests/site-chrome.sha256 and captures in output/responsive/site-chrome/. The aggregate workspace evidence is ../output/site-chrome-2026-10-05/, including immutable before-valid/, after-final/ and supplement/ records. Before images were not overwritten. Contact sheets were opened for visual comparison.

The existing responsive source-link assertion was adapted only in Favicon Forge because the link moved to the footer. Its visibility, container and 44 px target checks remain enforced. No test baseline was relaxed to accept a layout failure.

This project has no standalone lab-performance script. CI and live-site verification are recorded against their exact pushed revision in the aggregate publication evidence. Local build success alone does not establish successful public deployment or physical-device support.
