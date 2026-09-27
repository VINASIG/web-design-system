# Components

**Status:** Draft proposal. Component behavior and examples are not approved policy yet.

The [UI element catalog](../elements/README.md) defines all 81 entries in the NameThatUI snapshot. Use it to identify the relevant pattern, then use this document for the component implementation guidance available here.

## Button

Use a button for an action in the current page and a link for navigation. Give each control a clear verb and keep the visible focus state. Use the primary style for the page's main action. Use the secondary style for supporting actions. Destructive actions should say what will be removed or changed.

## Text input

Show a persistent label. Use helper text for instructions and error text for a correction. Keep the entered value when validation fails. Associate the error with the field so assistive technology can announce it.

## Single-select dropdown

**Draft proposal.**

A selection dropdown has a closed trigger and an open options panel. When a design reference calls for a custom dropdown, customize both states to match the interface. Styling only the closed `<select>` control does not style the browser or operating-system popup. Inspect the opened menu rather than assuming it inherits the page styles.

- Prefer the project's existing accessible select or listbox component when one is available. Use a native `<select>` when platform behavior is an intentional fit for the task. Do not treat the default native popup as a custom branded menu.
- For a custom single-select popup, use an accessible button and listbox pattern, with a visible label, selected value, `aria-expanded`, `aria-controls`, an appropriate popup role, and an announced selected option.
- Support keyboard operation: open and move through options with the expected keys, select with Enter or Space, close with Escape, and allow focus to leave without trapping the user. Keep focus visible.
- Style the trigger and popup, including selected, hover, focus, disabled, and open states. Keep the popup legible, attached to its trigger, and within the viewport.
- Keep the value synchronized with the form or application state. Do not make a visual-only fake dropdown or use clickable generic containers without accessible interaction semantics.
- Before completion, inspect the open state, selection change, keyboard behavior, and narrow-screen placement.

If the framework or requirements make a custom accessible popup unsuitable, use a native select and document that choice. Do not silently ship a platform popup when the design explicitly requires a custom menu.

## Iconography

Use icons only when they improve recognition or communicate a control state. Keep a text label when the action or destination may not be clear from the icon alone. Avoid decorative symbols that repeat nearby text.

- Keep an action label and its inline icon in the same text flow. When a link wraps at high zoom or in a narrow layout, its icon must stay beside the final word instead of floating to the opposite edge.
- Use Flaticon UIcons Round Bold for pictographic interface icons. The icon font is bundled locally through the `@flaticon/flaticon-uicons` package.
- Render icons through `src/components/Icon.astro` and its named icon map. Do not type pictographic Unicode characters, emoji, or private-use codepoints into page markup or CSS.
- Keep Space Grotesk as the only text typeface. Its symbols may appear in prose or typographic notation. Use UIcons for interface arrows and pictographic icons shown alongside each other so they share one visual style.
- Mark an icon decorative when nearby text already supplies its meaning. Give an icon-only control a clear accessible name on the control itself.
- Use a hyphen-minus or a custom layout for list markers. Never use an icon or symbol as a list marker.
- Keep the visible `UIcons by Flaticon` attribution in the shared website footer when using the free icon pack.

## Status message

Pair the status color with a title or text label. Use a polite live region for updates that arrive without navigation. Reserve assertive announcements for urgent errors.

## Cards

Use a card to group related content. Make a card clickable only when the whole region leads to one destination. Otherwise place a clearly labeled link or button inside it.

## Component page checklist

Every future component specification should document its purpose, anatomy, variants, interaction states, keyboard behavior, responsive behavior, accessibility requirements, and a working example. For dropdowns, the example must show both the closed trigger and the open options panel.
