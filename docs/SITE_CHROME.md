# Shared website header and footer

The owner requested consistent headers and footers across VINASIG websites on 5 October 2026. This contract covers the common identity and utility navigation. Product layouts, documentation sidebars and task-specific navigation remain independent.

## Header

- Use one identity row marked data-site-header. The original transparent horizontal logo is 132 CSS px wide at its original 540 by 140 ratio. Its native link targets https://vinasig.io.vn/ and has a localized homepage name and at least a 44 px target.
- Select Primary Color on light surfaces and Reversed on dark surfaces, including system preference without JavaScript. Preserve the original artwork bytes.
- Put the appearance button followed by the reciprocal language link at the right. Each target is 44 px, with a 4 px gap. Lucide Sun and Moon remain 20 px. Both stay on the same identity row at 320 px and when text is enlarged.
- Source links belong to the footer. Product navigation uses a separate row or sidebar so it cannot displace the appearance and language controls on mobile.
- Use 32 px outer gutters and top spacing on wide screens, and 16 px at widths up to 760 px. The identity row follows the product's content width. A focused narrow tool may retain its narrower content measure.

## Footer

- Mark the footer data-site-footer. Use a VINASIG homepage link followed by a localized navigation with Source code, Report an issue and Licenses, in that order.
- Keep the source destination tied to the exact deployed revision where the product supports it. Issues target the product repository. Licenses target its published local notice or license page. Required attributions remain available there.
- Optional product-specific destinations may follow these three links. The homepage retains its contact directory.
- Use a top border, 48 px separation from content and 24 px block padding. At widths up to 760 px use 32 px separation, 16 px padding and put the brand link above the wrapping link group. All links have a 44 px target height and readable 0.875rem text.
- Do not add a logo tile, copyright ownership guess, repeated promotional tagline, badges or a new runtime dependency.

## Source and maintenance

### Documentation layout integration

The documentation site's identity header, sidebar/content grid and footer share the same centered `chrome-container` and `--site-content-width` value. Its 80rem maximum includes the sidebar. Keep the shared outer gutters instead of making the documentation grid full viewport width or adding another horizontal inset to the main content.

Use semantic theme colors for navigation text, hover, active state and dividers. A documentation sidebar must not retain a fixed dark surface in the light theme. Let it size to its navigation, remain within the documentation grid and stop before the footer. On wide screens, its sticky position has a 24px top inset and a viewport-bounded scroll area. Below 960px the navigation becomes a wrapping row above the document.

Inspect the whole composed layout at both the top and bottom of a long page. Matching isolated header/footer dimensions does not establish alignment with product navigation and content. Confirm the shared left/right edges, safe gutters, theme colors and sticky behavior in both languages and at breakpoint neighbors.

src/styles/site-chrome.css is the shared CSS source. src/components/SiteFooter.astro provides the Astro footer. Consumers copy these small source files with their existing build tools. Unphar uses equivalent semantic HTML and the same CSS because it deliberately has no framework.

Consumer copies are project-owned, outside managed standards snapshots. Change the source contract first, review its diff, then synchronize consumers in a bounded adoption task. Keep the existing standards hashes intact. Regression tests pin the CSS digest and check actual geometry, localized destinations, appearance changes, keyboard links and JavaScript-unavailable fallbacks. Inspect saved screenshots as well as DOM assertions.
