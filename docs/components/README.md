# Components

**Status:** Draft proposal. Component behavior and examples are not approved policy yet.

## Button

Use a button for an action in the current page and a link for navigation. Give each control a clear verb and keep the visible focus state. Use the primary style for the page's main action; use the secondary style for supporting actions. Destructive actions should say what will be removed or changed.

## Text input

Show a persistent label. Use helper text for instructions and error text for a correction. Keep the entered value when validation fails. Associate the error with the field so assistive technology can announce it.

## Single-select dropdown

**Status:** Draft proposal.

A selection dropdown has two visible parts: the closed trigger and the open options panel. When a design reference calls for a custom dropdown, customize both states to match the interface. Styling only the closed `<select>` control does not style the browser or operating-system popup; inspect the opened menu rather than assuming it inherits the page styles.

- Prefer the project's existing accessible select/listbox component when one is available. Use a native `<select>` when platform-native behavior is an intentional fit for the task; do not treat the default native popup as a custom branded menu.
- For a custom single-select popup, use an accessible button/listbox pattern, with a visible label, selected value, `aria-expanded`, `aria-controls`, an appropriate popup role, and an announced selected option.
- Support keyboard operation: open and move through options with the expected keys, select with Enter or Space, close with Escape, and allow focus to leave without trapping the user. Keep focus visible.
- Style the trigger and popup, including selected, hover, focus, disabled, and open states. Keep the popup legible, attached to its trigger, and within the viewport.
- Keep the value synchronized with the form or application state. Do not make a visual-only fake dropdown or use clickable generic containers without accessible interaction semantics.
- Before completion, inspect the open state, selection change, keyboard behavior, and narrow-screen placement.

If the framework or requirements make a custom accessible popup unsuitable, use a native select and document that choice. Do not silently ship a platform popup when the design explicitly requires a custom menu.

## Status message

Pair the status color with a title or text label. Use a polite live region for updates that arrive without navigation; reserve assertive announcements for urgent errors.

## Cards

Use a card to group related content. Make a card clickable only when the whole region leads to one destination; otherwise place a clearly labeled link or button inside it.

## Component page checklist

Every future component specification should document its purpose, anatomy, variants, interaction states, keyboard behavior, responsive behavior, accessibility requirements, and a working example. For dropdowns, the example must show both the closed trigger and the open options panel.
