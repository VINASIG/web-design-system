# Documentation publication review

Reviewed on 3 October 2026 for the owner's organization maintenance request.

## Baseline and scope

The repository was public source with no configured website deployment. The local `main` checkout was clean and matched `origin/main` before work. Draft design guidance, the 81 specimen catalog, original artwork, font licensing and the imported standards snapshot remain preserved.

The owner's publication request selects GitHub Pages, matching the organization's other static tools. The deployment decision is recorded in [decision 0002](../decisions/0002-github-pages-publication.md). Repository description, homepage and topics were updated through the GitHub API. The unsupported TypeScript proposal was closed with its reviewed compatibility reason in [the dependency audit](dependencies-2026-10-03.md).

## Repairs and regression coverage

| Area | Observed cause | Repair and evidence |
| --- | --- | --- |
| Project-path publication | Navigation, font and public asset references assumed root hosting | Resolve internal routes and specimen attributes against `/web-design-system/`, bundle the local font, and test both attribute quote styles. Browser checks request favicons, load the font and follow keyboard navigation. |
| Search metadata | The new public documentation URL needed canonical references and a sitemap | Emit canonical metadata, keep the error page unindexable, and publish a sitemap of the seven content routes. Regression checks verify every canonical entry and exclude the error page. |
| WebKit keyboard navigation | The skip link and scrollable segmented column view needed explicit focus support | Add focusability and implement ArrowLeft, ArrowRight, Home and End scrolling. Existing containment checks remain; additional assertions verify focus and each key. |
| Code blocks | Three horizontally scrollable code panels were not keyboard focusable | Add focusable, named regions while preserving their code and intentional local scrolling. |
| Accessible semantics | Generated recipient items lacked list-item roles, listbox options exposed invalid expanded states, and two specimen wrappers used invalid role/name combinations | Preserve selection and folder navigation using supported semantics, list items, native ordered-list live announcements and a named group. No interaction was removed. |
| Contrast | Agent-card supporting text and editor-color text were slightly below the small-text threshold on their surfaces | Use the existing foreground token in those contexts. Identity colors remain unchanged. |
| Small targets | Pagination dots, window controls and stacked stepper buttons were below the automated 24 px target-size threshold | Enlarge interactive bounds, preserve the small visible marks and retain the control functions. |
| Evidence capture | The long element library exceeded WebKit's screenshot dimension limit | Capture every real viewport segment for pages over 30,000 px. No page zoom, content removal or overflow suppression is used. |

## Local verification observed

- Locked install with the pinned Node 24.21.0 and npm 11.19.0 toolchain passed. Consumer runtime minimums remain unchanged.
- `npm run check` passed snapshot, content, syntax and Astro checks with zero errors, warnings and hints.
- Seven standards-integrity tests and two deployment-path tests passed. The standards tests retain positive and negative fixtures.
- The production build passed. The preview starts on an available port and uses the same deployment base; only its own process is stopped.
- WebKit passed **672/672** assertions at 360x800, 390x844, 768x1024, 1024x768 and 1440x900 in `output/responsive/runs/org-publish-webkit/`.
- Chromium with touch and normal motion passed **426/426** assertions at 320x900, 360x800 and 390x844 in `output/responsive/runs/org-publish-touch/`.
- Both runs execute axe rules for WCAG A and AA through 2.2 on all eight HTML routes, including the explicit error resource. No exclusions or accepted violation baseline were introduced.

Screenshots and structured reports retain the earlier failing runs separately. The organization checkout contains focused before/after images in `vinasig/output/org-audit-2026-10-03/web-design-system/a11y-before/` and `a11y-after/`, plus the editor-color contrast comparison. Default, keyboard, disclosure, popover, menu, tab, form and specimen states are captured by the regression suite. Additional breakpoint checks and final public-URL receipts are stored separately after this reviewed candidate.

## Publication gate and limits

The first expanded CI run found two additional defects: Firefox's 320 px segmented labels needed smaller inline padding, and WebKit on Linux briefly laid out the color panel beyond the preview's reserved height. The follow-up reserves the panel's untransformed height as wrapper padding and checks both that reservation and an open-panel resize. Existing label and containment assertions remain unchanged. Failing CI images are retained separately in the organization audit output; the final CI run establishes whether these repairs pass all engines.

After those repairs, the source check and build passed again, and targeted local WebKit verification passed **564/564** assertions at 320x900, 360x800, 390x844 and 1024x768 in `output/responsive/runs/org-controls-webkit/`. The earlier Chromium breakpoint review covered 34 widths around all 16 CSS media-query boundaries, plus intermediate widths, with no observed overflow or axe violation in the default overview and element-library states. The final candidate receives a separate breakpoint run to preserve those earlier images.

GitHub Actions requires Chromium, Firefox and WebKit on both Ubuntu and Windows, including touch with normal motion. Deployment can use only the verified static artifact from `main` after all six jobs pass. The final pushed revision, CI run and HTTP/browser receipts establish completion; this source audit cannot contain its own final commit hash.

Local Firefox could not launch in this Windows environment. It is required in the CI matrix. The adopted typed-lint, Stylelint, generated-HTML and Lighthouse presets remain phased items in [the adoption inventory](../agents/standards.md). Passing these checks does not establish full standards or WCAG certification, physical-device coverage, field performance or independent SI-agent task success.
