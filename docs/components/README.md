# Components

**Status:** General component proposals remain draft. The owner approved the interface-writing and custom-control requirements below on 3 October 2026.

The [UI element catalog](../elements/README.md) defines all 81 entries in the NameThatUI snapshot. Use it to identify the relevant pattern, then use this document for the component implementation guidance available here.

## Button

Use a button for an action in the current page and a link for navigation. Give each control a clear verb and keep the visible focus state. Use the primary style for the page's main action. Use the secondary style for supporting actions. Destructive actions should say what will be removed or changed.

## Text input

Show a persistent label. Use helper text for instructions and error text for a correction. Keep the entered value when validation fails. Associate the error with the field so assistive technology can announce it.

## Single-select dropdown

**Approved requirement from 3 October 2026.**

A selection dropdown has a closed trigger and an open options panel. Both must match the interface's tokens and Space Grotesk. Styling only the closed `<select>` does not style its browser or operating-system popup. Platform select popups do not satisfy this requirement.

- Prefer a reviewed accessible select or listbox control. The working component-page example uses `src/scripts/select-control.ts` with `src/styles/select-control.css`. Its hidden native select retains values, form reset and disabled state. The visible combobox implements keyboard navigation, selection, type-ahead and cancellation.
- For a custom single-select popup, use an accessible button and listbox pattern, with a visible label, selected value, `aria-expanded`, `aria-controls`, an appropriate popup role, and an announced selected option.
- Support keyboard operation: open and move through options with the expected keys, select with Enter or Space, close with Escape, and allow focus to leave without trapping the user. Keep focus visible.
- Style the trigger and popup, including selected, hover, focus, disabled, and open states. Keep the popup legible, attached to its trigger, and within the viewport.
- Keep the value synchronized with the form or application state. Do not make a visual-only fake dropdown or use clickable generic containers without accessible interaction semantics.
- Before completion, inspect the open state, selection change, keyboard behavior, and narrow-screen placement.

Date and time controls must retain direct entry and a styled picker when needed. Color controls must expose styled color choices and editable values. Native ranges may retain browser semantics, with styled tracks and thumbs in every supported engine. Use `src/styles/range-control.css` as the baseline and preserve hue tracks where color is the value being chosen. File-selection, print and download browser dialogs remain platform interactions.

Test closed and opened controls, keyboard, touch, selected/disabled/error states, form reset, light/dark themes where supported, narrow viewports and enlarged text. Keep popups within the viewport. An axe result complements interaction and screenshot review. The implementation follows the [WAI select-only combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/). Actual screen-reader and device coverage must be reported separately.

## Interface writing

Apply LANG-004 and LANG-005 from the imported standards to every locale and dynamic state. Use natural sentences, ASCII hyphens and readable labels. Avoid semicolons, en/em dashes, label-colon fragments, slash separators, all-caps styling, unnecessary abbreviations and parenthetical explanations. Use semantic lists with a hyphen marker or custom row layout. Keep required code, URL, time and legal syntax correct. Catalog source names remain unchanged, while the displayed aliases use a readable hyphen layout.

## Iconography

Use icons only when they improve recognition or communicate a control state. Keep a text label when the action or destination may not be clear from the icon alone. Avoid decorative symbols that repeat nearby text.

- Keep an action label and its inline icon in the same text flow. When a link wraps at high zoom or in a narrow layout, its icon must stay beside the final word instead of floating to the opposite edge.
- Use Lucide SVGs for pictographic interface icons. Render shared icons through `src/components/Icon.astro` and demo icons through `src/scripts/icons.ts`.
- Use Simple Icons for third-party company and product logos such as Google or Apple. Their renderer inherits `currentColor` by default; choose a brand color only when it fits the use and follows current brand guidance instead of applying every `icon.hex` automatically. Provider sign-in actions follow the provider's approved mark and rules: the Google sign-in G must use its standard multicolor version. Keep company marks separate from general interface icons.
- Do not type pictographic Unicode characters, emoji, or private-use codepoints into page markup or CSS.
- Keep Space Grotesk as the only text typeface. Its symbols may appear in prose or typographic notation. Use Lucide for interface arrows and pictographic icons shown alongside each other so they share one visual style.
- Mark an icon decorative when nearby text already supplies its meaning. Give an icon-only control a clear accessible name on the control itself.
- Use a hyphen-minus or a custom layout for list markers. Never use an icon or symbol as a list marker.

## Status message

Pair the status color with a title or text label. Use a polite live region for updates that arrive without navigation. Reserve assertive announcements for urgent errors.

## Cards

Use a card to group related content. Make a card clickable only when the whole region leads to one destination. Otherwise place a clearly labeled link or button inside it.

## Component page checklist

Every future component specification should document its purpose, anatomy, variants, interaction states, keyboard behavior, responsive behavior, accessibility requirements, and a working example. For dropdowns, the example must show both the closed trigger and the open options panel.
