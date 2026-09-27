# Foundations

**Status:** Draft proposal. These foundations are examples for review, not approved organization policy.

Foundations are the shared visual and behavioral choices that components build on. Implemented color tokens live in `src/styles/tokens.css`.

## Color

Use semantic token names in interface code. The current palette maps to the VINASIG identity colors:

- `--color-scout-blue`: primary actions and links.
- `--color-thinker-orange`: attention and secondary emphasis.
- `--color-builder-green`: success and confirmation.
- `--color-auditor-red`: destructive actions and errors.
- `--color-core-graphite`: primary text and dark surfaces.
- `--color-canvas` and `--color-surface`: page and component backgrounds.

Do not communicate status through color alone. Pair status colors with text or an icon, and check contrast before using colored text on a surface.

## Typography

- Use the local Space Grotesk variable font as the sole typeface.
- Use its variable weight axis from 300 to 700.
- Keep body copy readable with a comfortable line length and line height.
- Do not load a remote font or add another family as a visual alternative.

## Spacing and layout

The prototype uses a 4 px spacing base and a small scale of multiples. Prefer the spacing tokens over one-off values. Keep main content readable on wide screens and let navigation and examples reflow on narrow screens.

## Responsive behavior

The initial layout uses these proposed breakpoints:

- Small: below 640 px.
- Medium: 640–959 px.
- Large: 960 px and above.

Treat the ranges as starting points. Choose breakpoints when content no longer fits, not to match a specific device model.

## Accessibility

- Use semantic elements and a logical heading order.
- Make all controls usable by keyboard and show a visible focus indicator.
- Give inputs visible labels and buttons clear action names.
- Keep text contrast and target sizes under review as this draft is tested.
