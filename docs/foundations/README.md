# Foundations

**Status:** Draft proposal. These foundations are examples for review, not approved organization policy.

Foundations are the shared visual and behavioral choices that components build on. Implemented color tokens live in `src/styles/tokens.css`.

## Color

Use semantic token names in interface code. These tokens map to the VINASIG identity colors:

- `--color-scout-blue` is for primary actions and links.
- `--color-thinker-orange` is for attention and secondary emphasis.
- `--color-builder-green` is for success and confirmation.
- `--color-auditor-red` is for destructive actions and errors.
- `--color-core-graphite` is for primary text and dark surfaces.
- `--color-canvas` and `--color-surface` are for page and component backgrounds.

Do not communicate status through color alone. Pair status colors with text or an icon, and check contrast before using colored text on a surface.

## Typography

- Use the local Space Grotesk variable font as the sole typeface.
- Use its variable weight axis from 300 to 700.
- Set body copy near 1rem and reuse a modest shared type scale.
- Keep supporting text readable and page titles at or below 2.75rem.
- Create hierarchy with weight and spacing rather than oversized type.
- Keep paragraphs concise. Rephrase copy when a line would end with only one or two short words.
- Do not load a remote font or add another family as a visual alternative.

## Writing style

- Keep website copy and its related guidance in clear, concise English.
- Do not use em dash or en dash characters. Use a hyphen-minus only where punctuation or a list marker needs one.
- Mark lists with hyphen-minus characters or a custom layout. Do not use round, square, arrow, or chevron glyphs as list markers.
- Avoid semicolons in prose, label-colon-value phrasing, term-dash definitions, parenthetical term definitions, and slash separators. Use a complete sentence instead. Keep punctuation required by code syntax.
- Use straight single and double quotation marks. Avoid unexplained abbreviations and all-caps wording, except for names, code, and identifiers that require it.

## Spacing and layout

The prototype uses a 4 px spacing base and a small scale of multiples. Prefer the spacing tokens over one-off values. Keep main content readable on wide screens and let navigation and examples reflow on narrow screens.

## Responsive behavior

The initial layout uses these proposed breakpoints:

- Small screens are below 640 px.
- Medium screens span 640-959 px.
- Large screens start at 960 px.

Treat the ranges as starting points. Choose breakpoints when content no longer fits, not to match a specific device model.

## Accessibility

- Use semantic elements and a logical heading order.
- Make all controls usable by keyboard and show a visible focus indicator.
- Give inputs visible labels and buttons clear action names.
- Keep text contrast and target sizes under review as this draft is tested.
