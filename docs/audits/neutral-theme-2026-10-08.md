# Neutral appearance adoption

The owner approved the Radix Gray background and text demonstration for the complete VINASIG ecosystem on 8 October 2026. The scope is 14 existing websites and the upstream agent-standards guidance. The organization profile, directory tooling and Vietnamese Passphrase CLI have no independent interface theme to change.

The implemented roles are recorded in [the shared appearance contract](../foundations/theme-colors.md). Both explicit and system themes use the same values, including pages with JavaScript disabled. Identity anchors, original artwork, font bytes, archived palette data and generated user images keep their original values. No dependency or network-based theme service was introduced.

The rendered CSS regression measures both locales, both themes and an explicit override against the opposite system theme. On the four neutral surfaces, the minimum observed ordinary text contrast is 12.371:1 and supporting text is 4.829:1. Strong boundaries reach at least 3.094:1 and progress indicators against the depleted track reach 3.168:1. The assertions use unrounded ratios. Meaningful focus reaches at least 6.828:1. These numbers describe the inspected roles and backgrounds, not every possible combination of palette primitives.

The Chromium production-preview suite passed the palette, site chrome, responsive, localization, control and forced-color gates. It includes 804 responsive assertions and 416 chrome cases. A separate rollout capture measured actual controls, placeholders and action icons in both locales and themes at desktop and narrow widths. The review identified and corrected a low-opacity QR Scanner placeholder and enlarged-text overflow in the updated Foundations color reference. The existing gates and thresholds were retained.

Raw before and after screenshots and measurements are retained locally under output/radix-gray-2026-10-08/ in the ecosystem workspace. Per-project checks, source pins, browser reports, CI and deployment revisions provide the subsequent adoption evidence. The release and deployed observations must be verified for the actual published revisions rather than inferred from this local audit.

Physical devices, screen readers, participant reading-comfort studies and independent accessibility certification were not run. Automated contrast and accessibility checks support the inspected states and do not establish a universal preference for one appearance.
