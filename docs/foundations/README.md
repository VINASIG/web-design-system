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

### Extended palette

Use this extended palette only when a component needs additional categories or chart series. These colors are supporting options, not additions to the VINASIG identity. Keep the established semantic tokens for information, success, warning, and error states.

Warm Graphite, Carmine, Leaf, Deep Blue, and Tangerine alias existing identity tokens. The remaining colors are optional accents.

| Palette color | Base token | Base value | Deep tone token | Deep tone |
| --- | --- | --- | --- | --- |
| Citron | `--color-palette-citron` | `#DDD605` | `--color-palette-citron-shade` | `#373501` |
| Porcelain | `--color-palette-porcelain` | `#E3D4D1` | `--color-palette-porcelain-shade` | `#383534` |
| Fog | `--color-palette-fog` | `#CECACA` | `--color-palette-fog-shade` | `#333232` |
| Warm Graphite | `--color-palette-warm-graphite` | `#443A3B` | `--color-palette-warm-graphite-shade` | `#110E0E` |
| Carmine | `--color-palette-carmine` | `#971607` | `--color-palette-carmine-shade` | `#250501` |
| Clay | `--color-palette-clay` | `#B4684D` | `--color-palette-clay-shade` | `#2D1A13` |
| Saffron | `--color-palette-saffron` | `#DEB12D` | `--color-palette-saffron-shade` | `#372C0B` |
| Leaf | `--color-palette-leaf` | `#47A036` | `--color-palette-leaf-shade` | `#04280D` |
| Lagoon | `--color-palette-lagoon` | `#2CBAA8` | `--color-palette-lagoon-shade` | `#0B2E2A` |
| Deep Blue | `--color-palette-deep-blue` | `#21497B` | `--color-palette-deep-blue-shade` | `#08121E` |
| Violet | `--color-palette-violet` | `#9A5CC6` | `--color-palette-violet-shade` | `#261731` |
| Tangerine | `--color-palette-tangerine` | `#EB7114` | `--color-palette-tangerine-shade` | `#3B1D05` |
| Sky | `--color-palette-sky` | `#8BB3FF` | `--color-palette-sky-shade` | `#232D40` |
| Amber | `--color-palette-amber` | `#FFAA00` | `--color-palette-amber-olive-shade` | `#2A2A00` |
| Amber | `--color-palette-amber` | `#FFAA00` | `--color-palette-amber-brown-shade` | `#402A00` |

Treat deep tones as palette references, not general interface shadows or pre-approved text colors. Check contrast for each actual foreground and background combination. Do not add saturated colors for decoration or replace a semantic status color with an extended palette color.

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
