# Foundations

**Status:** Draft proposal. These foundations are examples for review, not approved organization policy.

Foundations are the shared visual and behavioral choices that components build on. Implemented color tokens live in `src/styles/tokens.css`.

## Visual direction

**Status:** Draft proposal. This direction is a shared starting point for review, not approved organization policy.

Use **Bright Playful Minimalism** as the default visual direction for this prototype. Flat design and minimalism form the structural base. Keep pages bright, clear, and friendly through restrained identity color, simple geometry, and purposeful illustration.

- Keep layouts content-led, with clear hierarchy, measured typography, and useful spacing.
- Use light neutral surfaces by default. Reserve saturated identity colors for actions, links, status, and a few deliberate accents.
- Use simple flat shapes. Pixel-inspired and rounded-square details may echo the logo, but keep them sparse and never distort controls, text, or supplied assets.
- Add illustration only when it explains content or supports a defined user need. Do not use it to fill empty space.
- Use restrained corner rounding and shadows. Avoid defaulting to gradients, oversized headings, repeated cards without distinct content, pill shapes, or decorative badges. Use cards when they clarify a real content group.
- Treat Apple, GitHub, and Duolingo as separate references only when a task names a specific quality to borrow. Do not imitate or combine their complete visual systems.
- Turn vague goals such as "ultra-modern" or "ahead of its time" into observable choices about layout, color, typography, and interaction. Do not add trend-driven details without a user need.

When a task or approved product decision gives a more specific direction, follow it within scope. Otherwise use this proposal and the existing tokens, components, and supplied assets. If a consequential choice is missing, ask or state the assumption instead of inventing product identity.

## Color

Keep the five recorded VINASIG identity colors unchanged. The existing color tokens are the canonical values:

- `--color-scout-blue` supports primary actions, links, and information.
- `--color-thinker-orange` supports attention and warnings.
- `--color-builder-green` supports success and confirmation.
- `--color-auditor-red` supports errors and destructive actions.
- `--color-core-graphite` supports primary text and dark surfaces.

Use derived shades for interface roles while keeping the identity anchors intact. Each accent family has a `-soft` shade for subtle backgrounds, a `-border` shade for outlines, and a `-strong` shade for high-contrast text, icons, and interaction states. Use the base color for brand accents and indicators.

Use semantic tokens in interface code:

- `--color-info`, `--color-info-accent`, `--color-info-background`, and `--color-info-border` map information to Scout Blue.
- `--color-success`, `--color-success-accent`, `--color-success-background`, and `--color-success-border` map success to Builder Green.
- `--color-warning`, `--color-warning-accent`, `--color-warning-background`, and `--color-warning-border` map warnings to Thinker Orange.
- `--color-error`, `--color-error-accent`, `--color-error-background`, and `--color-error-border` map errors to Auditor Red.

Use `--color-canvas`, `--color-surface`, `--color-surface-muted`, and `--color-surface-hover` for page and component surfaces. Use the shared text and border tokens instead of adding near-duplicate neutral values. Do not communicate status through color alone. Pair status color with text or an icon, and check text contrast on each surface.

### Shared palette

Palette inspired by Minecraft.

Brand Assets owns the canonical palette. This project adopts an exact JSON copy with a reviewed revision and SHA-256 in [the source record](../PALETTE_SOURCE.json). The complete [name, Hex, RGB and token reference](palette-reference.md) is generated from that data. The Foundations page and src/styles/palette.css use the same record.

There are 16 base colors, 30 deep tones and 45 distinct Hex values. The five identity anchors retain their original names and values. Supporting colors are Clay, Saffron, Lagoon, Violet and Sky. Neutrals are Porcelain, Fog, Stone, Slate, Ink and Paper. Additional dark tones use their own VINASIG names. Bright base accents outside the reviewed selection are not part of this palette.

Deep tones are reference primitives. Check actual text and background contrast before use. Semantic status colors retain their existing roles. Use npm run check:palette to verify the source hash, generated CSS and translated names. Updating upstream data requires reviewing and pinning a new revision rather than fetching mutable data during a build.

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

- Small screens are below 761 px.
- Medium screens span 761-959 px.
- Large screens start at 960 px.

Treat the ranges as starting points. Choose breakpoints when content no longer fits, not to match a specific device model.

## Accessibility

- Use semantic elements and a logical heading order.
- Make all controls usable by keyboard and show a visible focus indicator.
- Give inputs visible labels and buttons clear action names.
- Keep text contrast and target sizes under review as this draft is tested.
