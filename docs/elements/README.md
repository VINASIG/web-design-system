# UI element catalog

**Status:** Draft proposal. This catalog is a working reference, not approved organization policy.

This library covers all 81 interface entries listed by [NameThatUI](https://namethatui.com/) in the snapshot reviewed on 2026-09-27. It includes 49 web entries and 32 macOS entries. Each entry has an original explanation and a rendered visual sample built with the VINASIG design direction. The examples are original implementations, not copied designs.

## How agents should use this catalog

- Read the entry that matches the interface being built or reviewed.
- Treat the platform label as scope. Apply web entries to web interfaces. Do not implement macOS-only chrome in a website.
- For a macOS entry, use its web adaptation only when the underlying need exists on the web. Some native concepts have no direct web equivalent.
- Follow the relevant component or pattern specification for implementation details. This catalog is a naming and coverage index, not a replacement for those specifications.
- Treat all guidance as draft until approved by a VINASIG owner.
- Keep docs/elements/catalog.json and docs/elements/specimens.json in sync with the published page at /elements/.

## Catalog structure

Each entry records its order in the source snapshot, stable identifier, display name, platform, category, definition, implementation guidance, and accessibility notes. macOS entries also include a web adaptation where a useful mapping exists.

The published page groups entries by platform and category. Every entry shows a reading-size visual sample, with a larger preview and definition, guidance, accessibility notes, and any web adaptation available on demand.

The HTML fragments in specimens.json are baseline markup. Shared visual styling lives in the published elements page. The page adds local demo behavior through src/scripts/element-demos.ts for controls that imply an action, including navigation, tabs, pagination, date selection, menus, autocomplete, form fields, switches, segmented controls, file selection, and resizing. These examples update only their own preview. They do not submit data to a service or create files. Layout, motion, and status examples remain visual references when an interaction would not add useful behavior.

These are interface demonstrations, not production-ready components. Check the relevant component guidance before using a pattern in a product.

## Reference sources

- [NameThatUI](https://namethatui.com/) supplies the names, grouping, and 81-entry snapshot.
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/) informs common web interaction patterns.
- [WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) informs autocomplete and selection guidance.
- [MDN dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) informs web dialog behavior.
- [Apple Human Interface Guidelines for menus](https://developer.apple.com/design/human-interface-guidelines/menus) and [toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars) inform the platform-specific macOS distinctions.

References are starting points for review. They do not make this draft guidance an approved policy.
