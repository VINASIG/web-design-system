# VINASIG Logo Usage

**Draft proposal except for the approved header rule below.** The variant names, master sizes, typeface, and logo concept below are facts recorded in the supplied VINASIG Brand Assets package. Other recommendations remain proposals.

## Website header approved on 4 October 2026

Use the original transparent horizontal lockup directly on the header surface. Primary Color, Color Black and Monochrome Black suit light surfaces. Reversed and Monochrome White suit dark surfaces. Select the variant using the actual surface, including light-only websites and consistently dark sidebars. A theme-aware header must select its asset without waiting for JavaScript.

Do not add a white background, padded or rounded card, border frame, shadow, filter or cropped corners around the logo. Keep its supplied aspect ratio and internal white geometry. Use surrounding layout spacing and a link target of at least 44 by 44 CSS px independently of the image size. Keep the accessible link name and original image rather than reconstructing the wordmark with live text. An unavoidable background exception needs owner review and a recorded reason.

On VINASIG websites, the native header or sidebar logo link opens `https://vinasig.io.vn/` with a localized homepage name. Project navigation and GitHub source links remain separate. Verify the destination and original transparent asset in the local build and on the deployed site.

The owner explicitly approved this header rule. It does not approve every other draft recommendation or grant artwork rights. Asset byte integrity and rendered-browser checks are separate requirements.

## Purpose and source

This guide helps people and SI agents select an existing logo export for a website context. It is based on `VINASIG_Logo_Story.md` and `99_Evidence/CREATION_RECORD.md` in the VINASIG Brand Assets archive. The original archive remains the source of editable artwork. Selected exported files are copied byte-for-byte into `public/brand/`. No editable logo source files are included here.

The mark is manually designed pixel art. Four agents surround a shared negative-space core: Scout observes, Thinker reasons, Builder acts, and Auditor evaluates. Their operating loop is to observe, reason, act, and evaluate. The symbol and wordmark have different roles: the symbol expresses the coordinated system, while the wordmark identifies VINASIG.

The logo package records **Space Grotesk** as the typeface and these master sizes:

- Primary Brand Mark: **25 × 25 px**.
- Contained Brand Mark: **27 × 27 px**.

## Choose a variant

| Variant                            | Use when                                                                                                        | Export in this repository                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Primary Brand Mark                 | The symbol can identify VINASIG on its own because the name is already clear nearby.                            | `public/brand/marks/primary-mark.svg`, `public/brand/marks/primary-mark-1000.png`     |
| Contained Brand Mark               | A square profile or avatar format needs the contained version. Its exported canvas includes a white field.      | `public/brand/marks/contained-mark.svg`, `public/brand/marks/contained-mark-1080.png` |
| Favicon                            | The browser or platform asks for one of the supplied icon sizes.                                                | `public/brand/favicons/favicon-16.png`, `favicon-32.png`, `favicon-48.png`            |
| Primary Color Horizontal Lockup    | A light surface can use the colored mark with a Core Graphite wordmark.                                         | `public/brand/lockups/primary-color.svg`                                              |
| Color Black Horizontal Lockup      | A light surface calls for the colored mark with a black wordmark.                                               | `public/brand/lockups/color-black.svg`                                                |
| Reversed Horizontal Lockup         | A dark surface calls for the colored mark with a white wordmark.                                                | `public/brand/lockups/reversed.svg`                                                   |
| Monochrome Black Horizontal Lockup | A single-color black lockup is needed on a light surface.                                                       | `public/brand/lockups/monochrome-black.svg`                                           |
| Monochrome White Horizontal Lockup | A single-color white lockup is needed on a dark surface.                                                        | `public/brand/lockups/monochrome-white.svg`                                           |
| Monochrome Brand Mark              | A symbol-only, one-color application is required. Select black for a light surface or white for a dark surface. | `public/brand/marks/monochrome-black.png`, `public/brand/marks/monochrome-white.png`  |

The five named identity colors recorded in the logo story are Scout Blue `#21497B`, Thinker Orange `#EB7114`, Builder Green `#47A036`, Auditor Red `#971607`, and Core Graphite `#443A3B`. White and black are also used by the exported reversed and monochrome variants.

## Favicon implementation requirement

Whenever an agent creates or changes a VINASIG website, it must inspect the shared document `<head>` and confirm that a favicon is configured. Do this even when the site already displays the logo in its header. Put the references in the shared layout or document template so every route inherits them. Do not duplicate the tags on individual pages.

Use the supplied favicon exports at all three provided sizes and verify that the URLs match the site's deployment base path:

```html
<link
  rel="icon"
  type="image/png"
  sizes="16x16"
  href="/brand/favicons/favicon-16.png"
/>
<link
  rel="icon"
  type="image/png"
  sizes="32x32"
  href="/brand/favicons/favicon-32.png"
/>
<link
  rel="icon"
  type="image/png"
  sizes="48x48"
  href="/brand/favicons/favicon-48.png"
/>
```

Before considering the website task complete, check that each referenced file is present in the build or deployment output. If a project has a non-root base path, adapt the URLs to that base. If a needed favicon export is missing, report the gap and request the proper asset instead of omitting the favicon or inventing a replacement.

## Draft usage recommendations

- Use an exported file from `public/brand/`. Do not redraw, re-typeset, crop, stretch, recolor, or add effects to the logo.
- Keep the whole mark or lockup visible. Choose a variant that remains clear on its background.
- For raster use, select the supplied export closest to the output size and avoid enlarging a small raster. Use the SVG exports when a scalable file is appropriate.
- Treat the lockup artwork as a single unit. Do not replace its wordmark with typed text.
- Check the result at the actual display size, especially for browser tabs and compact controls.

The supplied source material does **not** define a minimum display size, clear-space measurement, or a complete background and contrast matrix. This guide does not invent those mandatory values. Request owner review when a use case depends on them.

## Asset provenance and permissions

Files in `public/brand/` are unchanged copies of exports from VINASIG Brand Assets. They illustrate the guidance and retain their separate identity rights. The [VINASIG Brand Usage Policy](../../BRAND_POLICY.md) governs permitted references. The software and documentation grants exclude the logo artwork.
